import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { User, Palette, Lock, DatabaseBackup, CalendarPlus, Download, Upload, Check, Bell, Volume2, Smartphone, TestTube2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { authService } from "@/services/authService";
import { exportService, importService, notificationService, NotificationSettings } from "@/services/extraServices";
import api, { API_BASE_URL } from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Primitives";
import {
  isDesktopNotificationSupported, getDesktopPermission, requestDesktopPermission, showDesktopNotification,
  playNotificationSound, vibrateDevice, subscribeToPush, unsubscribeFromPush,
} from "@/utils/browserNotifications";

interface ProfileForm {
  name: string;
  avatarUrl?: string;
  timeFormat: string;
  dateFormat: string;
  language: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}

const SECTIONS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "data", label: "Dados", icon: DatabaseBackup },
  { id: "integrations", label: "Integrações", icon: CalendarPlus },
  { id: "security", label: "Segurança", icon: Lock },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState<SectionId>("profile");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatarUrl || "");

  const getAvatarSrc = (url?: string | null) => {
    if (!url) return undefined;
    if (url.startsWith("/api")) {
      return `${API_BASE_URL.replace(/\/$/, "")}${url}`;
    }
    return url;
  };

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(user?.avatarUrl || "");
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile, user?.avatarUrl]);
  const queryClient = useQueryClient();

  const { data: googleStatus } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      const { data } = await api.get("/integrations/google-calendar/status");
      return data.data as { configured: boolean; connected: boolean; message: string };
    },
    enabled: section === "integrations",
  });

  const { data: notifSettings, refetch: refetchNotifSettings } = useQuery({
    queryKey: ["notification-settings"],
    queryFn: notificationService.getSettings,
    enabled: section === "notifications",
  });
  const { data: channelsStatus } = useQuery({
    queryKey: ["notification-channels-status"],
    queryFn: notificationService.channelsStatus,
    enabled: section === "notifications",
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const desktopPermission = getDesktopPermission();

  async function handleSaveNotif(patch: Partial<NotificationSettings>) {
    setSavingNotif(true);
    try {
      await notificationService.updateSettings(patch);
      await refetchNotifSettings();
    } catch {
      toast.error("Não foi possível salvar as preferências");
    } finally {
      setSavingNotif(false);
    }
  }

  async function handleTogglePush(enabled: boolean) {
    if (enabled && channelsStatus?.vapidPublicKey) {
      try {
        const sub = await subscribeToPush(channelsStatus.vapidPublicKey);
        if (sub) await notificationService.pushSubscribe(sub);
      } catch {
        toast.error("Não foi possível ativar push neste navegador");
      }
    } else if (!enabled) {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) await notificationService.pushUnsubscribe(endpoint);
    }
    await handleSaveNotif({ push: enabled });
  }

  async function handleRequestDesktop() {
    const permission = await requestDesktopPermission();
    if (permission === "granted") {
      toast.success("Notificações desktop ativadas");
      handleSaveNotif({ desktop: true });
    } else if (permission === "denied") {
      toast.error("Permissão negada pelo navegador");
    }
  }

  async function handleSendTest() {
    setSendingTest(true);
    try {
      const report = await notificationService.sendTest();
      if (notifSettings?.desktop) showDesktopNotification("Notificação de teste", "Seus canais estão funcionando!");
      playNotificationSound(notifSettings?.sound || "default");
      if (notifSettings?.vibration) vibrateDevice();

      if (report?.email?.attempted) {
        if (report.email.success) {
          toast.success(`E-mail: ${report.email.detail}`);
        } else {
          toast.error(`E-mail falhou: ${report.email.detail}`, { duration: 8000 });
        }
      } else {
        toast("Notificação por e-mail está desativada nas suas preferências", { icon: "ℹ️" });
      }
    } catch {
      toast.error("Não foi possível enviar o teste");
    } finally {
      setSendingTest(false);
    }
  }

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || "",
      avatarUrl: user?.avatarUrl || "",
      timeFormat: user?.timeFormat || "24h",
      dateFormat: user?.dateFormat || "DD/MM/YYYY",
      language: user?.language || "pt-BR",
    },
  });
  const passwordForm = useForm<PasswordForm>();

  const onSaveProfile = async (values: ProfileForm) => {
    setSavingProfile(true);
    try {
      let avatarUrl = values.avatarUrl;
      if (avatarFile) {
        const uploaded = await authService.uploadAvatar(avatarFile);
        avatarUrl = uploaded.avatarUrl || avatarUrl;
      }

      const updated = await authService.updateProfile({
        name: values.name,
        avatarUrl,
        timeFormat: values.timeFormat as "24h" | "12h",
        dateFormat: values.dateFormat,
        language: values.language,
      });
      updateUser(updated);
      toast.success("Perfil atualizado");
      setAvatarFile(null);
    } catch {
      toast.error("Não foi possível salvar seu perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const onSavePassword = async (values: PasswordForm) => {
    setSavingPassword(true);
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      toast.success("Senha alterada com sucesso");
      passwordForm.reset();
    } catch {
      toast.error("Senha atual incorreta");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRestore = async (file: File) => {
    setRestoring(true);
    try {
      await importService.restoreBackup(file);
      toast.success("Backup restaurado com sucesso");
      queryClient.invalidateQueries();
    } catch {
      toast.error("Não foi possível restaurar o backup");
    } finally {
      setRestoring(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="font-display text-lg font-bold text-slate-800 dark:text-white sm:text-xl">Configurações</h1>

      <div className="flex flex-col gap-5 sm:gap-6 md:flex-row">
        {/* Navegação de seções */}
        <nav className="scrollbar-hide -mx-1 flex gap-1 overflow-x-auto px-1 md:mx-0 md:w-52 md:shrink-0 md:flex-col md:overflow-visible md:px-0">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={clsx(
                "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors md:w-full",
                section === s.id
                  ? "bg-primary-500/10 text-primary-600 dark:text-primary-300"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Conteúdo da seção selecionada */}
        <div className="min-w-0 flex-1 space-y-5 sm:space-y-6">
          {section === "profile" && (
            <div className="card">
              <div className="mb-4 flex items-center gap-3">
                <Avatar name={user.name} url={getAvatarSrc(avatarPreview || user.avatarUrl)} size={56} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</p>
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>
              </div>

              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                <Input label="Nome" {...profileForm.register("name")} />
                <Input
                  label="Foto do perfil (URL)"
                  placeholder="https://..."
                  {...profileForm.register("avatarUrl")}
                />
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Upload de foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm shadow-slate-200 outline-none transition focus:border-primary-500 focus:ring-primary-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Formato de hora</span>
                    <select className="input-field" {...profileForm.register("timeFormat")}>
                      <option value="24h">24 horas</option>
                      <option value="12h">12 horas (AM/PM)</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Formato de data</span>
                    <select className="input-field" {...profileForm.register("dateFormat")}>
                      <option value="DD/MM/YYYY">DD/MM/AAAA</option>
                      <option value="MM/DD/YYYY">MM/DD/AAAA</option>
                      <option value="YYYY-MM-DD">AAAA-MM-DD</option>
                    </select>
                  </label>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-white/[0.06] px-3.5 py-2.5 text-xs text-slate-400">
                  Fuso horário detectado: <span className="font-medium text-slate-600 dark:text-slate-300">{user.timezone}</span>
                </div>
                <Button type="submit" loading={savingProfile}>
                  Salvar perfil
                </Button>
              </form>
            </div>
          )}

          {section === "appearance" && (
            <div className="card">
              <p className="mb-4 text-sm text-slate-400">
                Escolha o tema da interface. As cores de destaque se ajustam automaticamente para
                manter contraste e legibilidade em cada modo.
              </p>
              <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
                <button
                  onClick={() => setTheme("light")}
                  className={clsx(
                    "relative overflow-hidden rounded-2xl border p-4 text-left transition-colors",
                    theme === "light" ? "border-primary-500 ring-2 ring-primary-500/30" : "border-slate-200 dark:border-white/10"
                  )}
                >
                  <div className="mb-3 h-16 w-full rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-100" />
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                    ☀️ Claro {theme === "light" && <Check className="h-3.5 w-3.5 text-primary-500" />}
                  </span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={clsx(
                    "relative overflow-hidden rounded-2xl border p-4 text-left transition-colors",
                    theme === "dark" ? "border-primary-500 ring-2 ring-primary-500/30" : "border-slate-200 dark:border-white/10"
                  )}
                >
                  <div className="mb-3 h-16 w-full rounded-lg border border-white/10 bg-gradient-to-br from-slate-800 to-slate-950" />
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                    🌙 Escuro {theme === "dark" && <Check className="h-3.5 w-3.5 text-primary-500" />}
                  </span>
                </button>
              </div>
            </div>
          )}

          {section === "notifications" && notifSettings && (
            <div className="space-y-5">
              <div className="card">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-display font-semibold text-slate-700 dark:text-slate-200">
                    <Bell className="h-4 w-4 text-primary-500" /> Canais de notificação
                  </h3>
                  <Button variant="secondary" onClick={handleSendTest} loading={sendingTest}>
                    <TestTube2 className="h-4 w-4" /> Testar
                  </Button>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 dark:border-white/10">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">E-mail</p>
                      <p className="text-xs text-slate-400">Lembretes e notificações por e-mail</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary-500"
                      checked={notifSettings.email} onChange={(e) => handleSaveNotif({ email: e.target.checked })} />
                  </label>

                  <label className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 dark:border-white/10">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Push Notification</p>
                      <p className="text-xs text-slate-400">
                        {channelsStatus?.push ? "Notificações no navegador, mesmo com a aba fechada" : "Estrutura pronta — configure VAPID no servidor para ativar de verdade"}
                      </p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary-500"
                      checked={notifSettings.push} onChange={(e) => handleTogglePush(e.target.checked)} />
                  </label>

                  <div className="rounded-xl border border-slate-100 px-3.5 py-3 dark:border-white/10">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Notificação desktop</p>
                        <p className="text-xs text-slate-400">
                          {!isDesktopNotificationSupported()
                            ? "Não suportado neste navegador"
                            : desktopPermission === "granted"
                              ? "Permissão concedida"
                              : "Peça permissão ao navegador para ativar"}
                        </p>
                      </div>
                      <input type="checkbox" className="h-4 w-4 rounded accent-primary-500"
                        checked={notifSettings.desktop} onChange={(e) => handleSaveNotif({ desktop: e.target.checked })} />
                    </div>
                    {isDesktopNotificationSupported() && desktopPermission !== "granted" && (
                      <Button variant="ghost" onClick={handleRequestDesktop}>Permitir notificações desktop</Button>
                    )}
                  </div>

                  <label className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 dark:border-white/10">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">SMS</p>
                      <p className="text-xs text-slate-400">
                        {channelsStatus?.sms ? "Ativo via Twilio" : "Estrutura pronta — configure o Twilio no servidor para ativar"}
                      </p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary-500"
                      checked={notifSettings.sms} onChange={(e) => handleSaveNotif({ sms: e.target.checked })} />
                  </label>

                  <label className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3 dark:border-white/10">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">WhatsApp</p>
                      <p className="text-xs text-slate-400">
                        {channelsStatus?.whatsapp ? "Ativo via WhatsApp Cloud API" : "Estrutura pronta — configure a Cloud API no servidor para ativar"}
                      </p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary-500"
                      checked={notifSettings.whatsapp} onChange={(e) => handleSaveNotif({ whatsapp: e.target.checked })} />
                  </label>

                  {(notifSettings.sms || notifSettings.whatsapp) && (
                    <Input
                      label="Número de telefone (com DDD e país)"
                      placeholder="+55 11 91234-5678"
                      defaultValue={notifSettings.phoneNumber || ""}
                      onBlur={(e) => handleSaveNotif({ phoneNumber: e.target.value })}
                    />
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="mb-3 flex items-center gap-2 font-display font-semibold text-slate-700 dark:text-slate-200">
                  <Volume2 className="h-4 w-4 text-primary-500" /> Som & vibração
                </h3>
                <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Som da notificação</span>
                    <div className="flex gap-2">
                      <select
                        className="input-field flex-1"
                        value={notifSettings.sound}
                        onChange={(e) => { handleSaveNotif({ sound: e.target.value }); playNotificationSound(e.target.value); }}
                      >
                        <option value="default">Padrão</option>
                        <option value="chime">Sino</option>
                        <option value="ping">Ping</option>
                        <option value="none">Sem som</option>
                      </select>
                      <Button variant="ghost" type="button" onClick={() => playNotificationSound(notifSettings.sound)}>▶</Button>
                    </div>
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5 dark:border-white/10">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <Smartphone className="h-4 w-4" /> Vibração (mobile)
                    </span>
                    <input type="checkbox" className="h-4 w-4 rounded accent-primary-500"
                      checked={notifSettings.vibration}
                      onChange={(e) => { handleSaveNotif({ vibration: e.target.checked }); if (e.target.checked) vibrateDevice(); }} />
                  </label>
                </div>
                {savingNotif && <p className="mt-2 text-xs text-slate-400">Salvando…</p>}
              </div>
            </div>
          )}

          {section === "data" && (
            <div className="card">
              <p className="mb-4 text-sm text-slate-400">
                Baixe um backup completo dos seus dados (categorias, eventos e tarefas) ou restaure a
                partir de um arquivo salvo anteriormente. A restauração é aditiva — não apaga dados existentes.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => exportService.backup()}>
                  <Download className="h-4 w-4" /> Baixar backup
                </Button>
                <label className="btn-secondary cursor-pointer">
                  {restoring ? "Restaurando..." : "Restaurar backup"}
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    disabled={restoring}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleRestore(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {section === "integrations" && (
            <div className="card">
              <div className="mb-3 flex items-center gap-2">
                <CalendarPlus className="h-4 w-4 text-primary-500" />
                <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Google Calendar</h3>
              </div>
              <p className="mb-3 text-sm text-slate-400">{googleStatus?.message || "Verificando disponibilidade..."}</p>
              <Button variant="secondary" disabled={!googleStatus?.configured}>
                Conectar Google Calendar
              </Button>
            </div>
          )}

          {section === "security" && (
            <div className="card">
              <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="space-y-4">
                <Input label="Senha atual" type="password" {...passwordForm.register("currentPassword", { required: true })} />
                <Input label="Nova senha" type="password" minLength={6} {...passwordForm.register("newPassword", { required: true })} />
                <Button type="submit" loading={savingPassword}>
                  Atualizar senha
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

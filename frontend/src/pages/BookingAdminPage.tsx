import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link2, Copy, RefreshCw, Mail, Clock, X, CalendarClock } from "lucide-react";
import { bookingService, Appointment, BookingSettings } from "@/services/bookingService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const WEEKDAY_LABEL = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function guestName(appointment: Appointment): string {
  try {
    const parsed = JSON.parse(appointment.participants || "[]");
    return parsed?.[0]?.name || "Convidado";
  } catch {
    return "Convidado";
  }
}

export default function BookingAdminPage() {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");
  const [copied, setCopied] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);

  const { data: booking, refetch: refetchBooking } = useQuery({
    queryKey: ["booking-settings"],
    queryFn: bookingService.getSettings,
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["booking-appointments", scope],
    queryFn: () => bookingService.listAppointments(scope),
  });

  async function handleSaveBooking(patch: Partial<BookingSettings>) {
    if (!booking) return;
    setSavingBooking(true);
    try {
      await bookingService.updateSettings(patch);
      await refetchBooking();
    } catch {
      toast.error("Não foi possível salvar as configurações");
    } finally {
      setSavingBooking(false);
    }
  }

  async function handleCopyLink() {
    if (!booking) return;
    await navigator.clipboard.writeText(bookingService.buildPublicUrl(booking.publicSlug));
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerateLink() {
    try {
      await bookingService.regenerateLink();
      await refetchBooking();
      toast.success("Link renovado — o link antigo deixou de funcionar");
    } catch {
      toast.error("Não foi possível renovar o link");
    }
  }

  async function handleCancel(id: string) {
    try {
      await bookingService.cancelAppointment(id);
      queryClient.invalidateQueries({ queryKey: ["booking-appointments"] });
      toast.success("Agendamento cancelado");
    } catch {
      toast.error("Não foi possível cancelar");
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-lg font-bold text-slate-800 dark:text-white sm:text-xl">Agendamentos</h1>
        <p className="text-sm text-slate-400">
          Compartilhe seu link para que outras pessoas marquem um horário direto na sua agenda.
        </p>
      </div>

      {/* Link compartilhável */}
      <div className="card">
        <div className="mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary-500" />
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Seu link de agendamento</h3>
        </div>
        <p className="mb-3 text-sm text-slate-400">
          Quem receber o link só vê seus horários livres — nenhum compromisso ou detalhe da sua agenda fica visível.
        </p>
        {booking && (
          <>
            <div className="mb-3 flex flex-col gap-2 xs:flex-row">
              <div className="input-field flex-1 select-all overflow-x-auto whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                {bookingService.buildPublicUrl(booking.publicSlug)}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" /> {copied ? "Copiado!" : "Copiar"}
                </Button>
                <Button type="button" variant="ghost" onClick={handleRegenerateLink} title="Gerar novo link">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={booking.enabled}
                onChange={(e) => handleSaveBooking({ enabled: e.target.checked })}
                className="h-4 w-4 rounded accent-primary-500"
              />
              Link ativo (aceitando agendamentos)
            </label>
          </>
        )}
      </div>

      {/* Preferências de disponibilidade */}
      {booking && (
        <div className="card space-y-4">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Disponibilidade</h3>
          <Input
            label="Título do compromisso"
            defaultValue={booking.title}
            onBlur={(e) => e.target.value !== booking.title && handleSaveBooking({ title: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Duração de cada horário</span>
              <select
                className="input-field"
                value={booking.slotMinutes}
                onChange={(e) => handleSaveBooking({ slotMinutes: Number(e.target.value) })}
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Antecedência mínima</span>
              <select
                className="input-field"
                value={booking.noticeMinutes}
                onChange={(e) => handleSaveBooking({ noticeMinutes: Number(e.target.value) })}
              >
                <option value={0}>Sem mínimo</option>
                <option value={60}>1 hora</option>
                <option value={180}>3 horas</option>
                <option value={720}>12 horas</option>
                <option value={1440}>1 dia</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Início do expediente</span>
              <input
                type="time"
                className="input-field"
                defaultValue={booking.workStart}
                onBlur={(e) => handleSaveBooking({ workStart: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Fim do expediente</span>
              <input
                type="time"
                className="input-field"
                defaultValue={booking.workEnd}
                onBlur={(e) => handleSaveBooking({ workEnd: e.target.value })}
              />
            </label>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Dias disponíveis</span>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_LABEL.map((label, idx) => {
                const active = booking.workDays.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const next = active
                        ? booking.workDays.filter((d) => d !== idx)
                        : [...booking.workDays, idx].sort();
                      handleSaveBooking({ workDays: next });
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      active
                        ? "bg-primary-500 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          {savingBooking && <p className="text-xs text-slate-400">Salvando…</p>}
        </div>
      )}

      {/* Agendamentos recebidos */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Agendamentos recebidos</h3>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs dark:bg-white/[0.06]">
            {(["upcoming", "past"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                  scope === s
                    ? "bg-white text-primary-600 shadow-sm dark:bg-slate-800 dark:text-primary-300"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {s === "upcoming" ? "Próximos" : "Passados"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400">Carregando…</p>
        ) : !appointments || appointments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400">
              {scope === "upcoming" ? "Nenhum agendamento futuro ainda." : "Nenhum agendamento passado."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {appointments.map((appt) => {
              const start = new Date(appt.startAt);
              const end = new Date(appt.endAt);
              return (
                <li
                  key={appt.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3.5 dark:border-white/10 xs:flex-row xs:items-center xs:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{guestName(appt)}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                      <Mail className="h-3 w-3 shrink-0" /> {appt.contactEmail}
                    </p>
                    {appt.description && (
                      <p className="mt-1 truncate text-xs text-slate-400">{appt.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                      <p className="flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3" />
                        {start.toLocaleDateString("pt-BR")}
                      </p>
                      <p>
                        {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {scope === "upcoming" && appt.status !== "canceled" && (
                      <button
                        onClick={() => handleCancel(appt.id)}
                        className="btn-ghost !p-1.5 rounded-full text-danger-500"
                        title="Cancelar agendamento"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

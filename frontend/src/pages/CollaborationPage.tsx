import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Share2, Users, MessageSquare, History, Plus, Mail, Trash2, Check,
  ShieldCheck, Eye, Pencil, UserPlus, Send,
} from "lucide-react";
import { collaborationService, Team } from "@/services/collaborationService";
import { eventService } from "@/services/eventService";
import { taskService } from "@/services/taskService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const TABS = [
  { id: "shares", label: "Compartilhamentos", icon: Share2 },
  { id: "teams", label: "Equipes", icon: Users },
  { id: "comments", label: "Comentários & Chat", icon: MessageSquare },
  { id: "history", label: "Histórico", icon: History },
] as const;

type TabId = (typeof TABS)[number]["id"];

function PermissionBadge({ permission }: { permission: string }) {
  return permission === "edit" ? (
    <span className="flex items-center gap-1 rounded-full bg-primary-500/10 px-2 py-0.5 text-[11px] font-medium text-primary-600 dark:text-primary-300">
      <Pencil className="h-3 w-3" /> Edição
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
      <Eye className="h-3 w-3" /> Visualização
    </span>
  );
}

export default function CollaborationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const acceptToken = searchParams.get("aceitar");
  const [tab, setTab] = useState<TabId>("shares");
  const queryClient = useQueryClient();

  // --- Compartilhamentos ---
  const { data: myShares } = useQuery({ queryKey: ["shares-mine"], queryFn: collaborationService.myShares });
  const { data: receivedShares } = useQuery({ queryKey: ["shares-received"], queryFn: collaborationService.receivedShares });

  const [shareType, setShareType] = useState<"calendar" | "event" | "task">("calendar");
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "edit">("view");
  const [shareEntityId, setShareEntityId] = useState("");
  const [creatingShare, setCreatingShare] = useState(false);

  const { data: eventOptions } = useQuery({
    queryKey: ["events-for-share"], queryFn: () => eventService.list(), enabled: shareType === "event",
  });
  const { data: taskOptions } = useQuery({
    queryKey: ["tasks-for-share"], queryFn: () => taskService.list(), enabled: shareType === "task",
  });

  async function handleCreateShare(e: React.FormEvent) {
    e.preventDefault();
    setCreatingShare(true);
    try {
      await collaborationService.createShare({
        entityType: shareType,
        entityId: shareType === "calendar" ? undefined : shareEntityId,
        email: shareEmail,
        permission: sharePermission,
      });
      toast.success("Convite enviado por e-mail");
      setShareEmail("");
      setShareEntityId("");
      queryClient.invalidateQueries({ queryKey: ["shares-mine"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Não foi possível compartilhar");
    } finally {
      setCreatingShare(false);
    }
  }

  async function handleRevoke(id: string) {
    await collaborationService.revokeShare(id);
    queryClient.invalidateQueries({ queryKey: ["shares-mine"] });
    toast.success("Compartilhamento removido");
  }

  async function handleAccept(token: string) {
    try {
      await collaborationService.acceptShare(token);
      toast.success("Convite aceito!");
      setSearchParams({});
      queryClient.invalidateQueries({ queryKey: ["shares-received"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Não foi possível aceitar o convite");
    }
  }

  // --- Equipes ---
  const { data: teams } = useQuery({ queryKey: ["teams"], queryFn: collaborationService.listTeams });
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteEmailByTeam, setInviteEmailByTeam] = useState<Record<string, string>>({});

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    await collaborationService.createTeam({ name: newTeamName.trim() });
    setNewTeamName("");
    queryClient.invalidateQueries({ queryKey: ["teams"] });
    toast.success("Equipe criada");
  }

  async function handleInvite(teamId: string) {
    const email = inviteEmailByTeam[teamId];
    if (!email) return;
    try {
      await collaborationService.inviteMember(teamId, { email });
      setInviteEmailByTeam((prev) => ({ ...prev, [teamId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Convite enviado");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Não foi possível convidar");
    }
  }

  async function handleSetAdmin(team: Team, memberId: string, currentRole: string) {
    await collaborationService.updateMemberRole(team.id, memberId, currentRole === "admin" ? "member" : "admin");
    queryClient.invalidateQueries({ queryKey: ["teams"] });
  }

  async function handleRemoveMember(teamId: string, memberId: string) {
    await collaborationService.removeMember(teamId, memberId);
    queryClient.invalidateQueries({ queryKey: ["teams"] });
    toast.success("Membro removido");
  }

  // --- Comentários / chat ---
  const [commentEntityType, setCommentEntityType] = useState<"event" | "task">("event");
  const [commentEntityId, setCommentEntityId] = useState("");
  const [newComment, setNewComment] = useState("");
  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["comments", commentEntityType, commentEntityId],
    queryFn: () => collaborationService.listComments(commentEntityType, commentEntityId),
    enabled: !!commentEntityId,
  });
  const { data: commentEvents } = useQuery({ queryKey: ["events-for-comments"], queryFn: () => eventService.list() });
  const { data: commentTasks } = useQuery({ queryKey: ["tasks-for-comments"], queryFn: () => taskService.list() });

  async function handleSendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !commentEntityId) return;
    await collaborationService.createComment(commentEntityType, commentEntityId, newComment.trim());
    setNewComment("");
    refetchComments();
  }

  // --- Histórico ---
  const { data: history } = useQuery({ queryKey: ["collab-history"], queryFn: () => collaborationService.history() });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-lg font-bold text-slate-800 dark:text-white sm:text-xl">Colaboração</h1>
        <p className="text-sm text-slate-400">Compartilhe sua agenda, trabalhe em equipe e acompanhe cada mudança.</p>
      </div>

      {acceptToken && (
        <div className="card flex flex-col items-start gap-2 border-primary-500/40 bg-primary-500/5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-300">Você recebeu um convite de compartilhamento.</p>
          <Button onClick={() => handleAccept(acceptToken)}>
            <Check className="h-4 w-4" /> Aceitar convite
          </Button>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-white/[0.06]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-primary-600 shadow-sm dark:bg-slate-800 dark:text-primary-300"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "shares" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-3 font-display font-semibold text-slate-700 dark:text-slate-200">Compartilhar</h3>
            <form onSubmit={handleCreateShare} className="space-y-3">
              <div className="flex gap-1.5">
                {(["calendar", "event", "task"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setShareType(type); setShareEntityId(""); }}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      shareType === type
                        ? "bg-primary-500 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400"
                    }`}
                  >
                    {type === "calendar" ? "Agenda inteira" : type === "event" ? "Um evento" : "Uma tarefa"}
                  </button>
                ))}
              </div>

              {shareType === "event" && (
                <select className="input-field" value={shareEntityId} onChange={(e) => setShareEntityId(e.target.value)} required>
                  <option value="">Selecione o evento…</option>
                  {eventOptions?.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              )}
              {shareType === "task" && (
                <select className="input-field" value={shareEntityId} onChange={(e) => setShareEntityId(e.target.value)} required>
                  <option value="">Selecione a tarefa…</option>
                  {taskOptions?.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              )}

              <Input
                label="E-mail da pessoa"
                type="email"
                required
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="pessoa@exemplo.com"
              />

              <div className="flex gap-1.5">
                {(["view", "edit"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSharePermission(p)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      sharePermission === p
                        ? "bg-primary-500 text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400"
                    }`}
                  >
                    {p === "view" ? <Eye className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    {p === "view" ? "Visualizar" : "Editar"}
                  </button>
                ))}
              </div>

              <Button type="submit" className="w-full" loading={creatingShare}>
                <Mail className="h-4 w-4" /> Enviar convite
              </Button>
            </form>
          </div>

          <div className="space-y-5">
            <div className="card">
              <h3 className="mb-3 font-display font-semibold text-slate-700 dark:text-slate-200">Compartilhados por mim</h3>
              {!myShares || myShares.length === 0 ? (
                <p className="text-sm text-slate-400">Você ainda não compartilhou nada.</p>
              ) : (
                <ul className="space-y-2">
                  {myShares.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-white/10">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{s.email}</p>
                        <p className="text-xs text-slate-400">
                          {s.displayName || (s.entityType === "calendar" ? "Agenda inteira" : s.entityType === "event" ? "Evento" : "Tarefa")} · {s.status === "accepted" ? "Aceito" : "Pendente"}
                        </p>
                        {s.teamName && <p className="text-[11px] text-slate-400">Equipe: {s.teamName}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <PermissionBadge permission={s.permission} />
                        <button onClick={() => handleRevoke(s.id)} className="text-danger-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <h3 className="mb-3 font-display font-semibold text-slate-700 dark:text-slate-200">Compartilhado comigo</h3>
              {!receivedShares || receivedShares.length === 0 ? (
                <p className="text-sm text-slate-400">Ninguém compartilhou nada com você ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {receivedShares.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-white/10">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                          {s.displayName || (s.entityType === "calendar" ? "Agenda compartilhada" : s.entityType === "event" ? "Evento compartilhado" : "Tarefa compartilhada")}
                        </p>
                        <p className="text-xs text-slate-400">{s.status === "accepted" ? "Aceito" : "Convite pendente"}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <PermissionBadge permission={s.permission} />
                        {s.status === "pending" && (
                          <Button variant="secondary" onClick={() => handleAccept(s.token)}>
                            Aceitar
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "teams" && (
        <div className="space-y-5">
          <div className="card">
            <h3 className="mb-3 font-display font-semibold text-slate-700 dark:text-slate-200">Nova equipe</h3>
            <form onSubmit={handleCreateTeam} className="flex flex-col gap-2 xs:flex-row">
              <input
                className="input-field flex-1"
                placeholder="Nome da equipe"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <Button type="submit"><Plus className="h-4 w-4" /> Criar equipe</Button>
            </form>
          </div>

          {teams?.map((team) => (
            <div key={team.id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">{team.name}</h3>
                <span className="text-xs text-slate-400">{team.members.length} membro(s)</span>
              </div>

              <ul className="mb-3 space-y-2">
                {team.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-white/10">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{m.name || m.email}</p>
                      <p className="text-xs text-slate-400 capitalize">{m.role === "owner" ? "Dono" : m.role === "admin" ? "Administrador" : "Membro"}</p>
                    </div>
                    {m.role !== "owner" && (
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          onClick={() => handleSetAdmin(team, m.id, m.role)}
                          title="Alternar administrador"
                          className={m.role === "admin" ? "text-primary-500" : "text-slate-400"}
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleRemoveMember(team.id, m.id)} className="text-danger-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="E-mail para convidar"
                  value={inviteEmailByTeam[team.id] || ""}
                  onChange={(e) => setInviteEmailByTeam((prev) => ({ ...prev, [team.id]: e.target.value }))}
                />
                <Button variant="secondary" onClick={() => handleInvite(team.id)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "comments" && (
        <div className="card">
          <div className="mb-4 flex flex-col gap-2 xs:flex-row">
            <select
              className="input-field xs:w-40"
              value={commentEntityType}
              onChange={(e) => { setCommentEntityType(e.target.value as any); setCommentEntityId(""); }}
            >
              <option value="event">Evento</option>
              <option value="task">Tarefa</option>
            </select>
            <select className="input-field flex-1" value={commentEntityId} onChange={(e) => setCommentEntityId(e.target.value)}>
              <option value="">Selecione…</option>
              {(commentEntityType === "event" ? commentEvents : commentTasks)?.map((item: any) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>

          {!commentEntityId ? (
            <p className="text-sm text-slate-400">Selecione um evento ou tarefa para ver os comentários e o chat.</p>
          ) : (
            <>
              <ul className="mb-3 max-h-80 space-y-2.5 overflow-y-auto">
                {comments?.length === 0 && <p className="text-sm text-slate-400">Nenhum comentário ainda.</p>}
                {comments?.map((c) => (
                  <li key={c.id} className="rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-white/[0.05]">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{c.authorName || "Alguém"}</span>
                      <span className="text-[11px] text-slate-400">{new Date(c.createdAt).toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{c.content}</p>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  className="input-field flex-1"
                  placeholder="Escreva um comentário…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button type="submit"><Send className="h-4 w-4" /></Button>
              </form>
            </>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="card">
          <h3 className="mb-3 font-display font-semibold text-slate-700 dark:text-slate-200">Histórico de alterações</h3>
          {!history || history.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma alteração registrada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-sm last:border-0 dark:border-white/10">
                  <span className="text-slate-600 dark:text-slate-300">{h.description}</span>
                  <span className="shrink-0 text-xs text-slate-400">{new Date(h.createdAt).toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

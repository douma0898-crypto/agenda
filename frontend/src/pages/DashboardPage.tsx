import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ListChecks, AlertTriangle, Clock3, Star, CalendarPlus, ListPlus, Timer } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { NotesWidget } from "@/components/dashboard/NotesWidget";
import { HabitsWidget } from "@/components/dashboard/HabitsWidget";
import { Loading, EmptyState, Badge } from "@/components/ui/Primitives";
import { formatTime, formatFullDate, PRIORITY_COLOR, PRIORITY_LABEL } from "@/utils/date";
import { useUIStore } from "@/contexts/useUIStore";
import { CalendarEvent } from "@/utils/types";

function TimelineEventRow({ event, isLast }: { event: CalendarEvent; isLast: boolean }) {
  const { openEventModal } = useUIStore();
  return (
    <button onClick={() => openEventModal(event)} className="group flex w-full gap-3 text-left sm:gap-4">
      <div className="flex w-12 shrink-0 flex-col items-center sm:w-14">
        <span className="pt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">{formatTime(event.startAt)}</span>
        <span className="my-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white dark:ring-transparent" style={{ backgroundColor: event.color }} />
        {!isLast && <span className="w-px flex-1 bg-slate-200/80 dark:bg-white/10" />}
      </div>
      <div className="min-w-0 flex-1 rounded-xl px-2.5 py-2 transition-colors group-hover:bg-slate-50 dark:group-hover:bg-white/5 sm:px-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{event.title}</p>
          {event.isFavorite && <Star className="h-3.5 w-3.5 shrink-0 fill-warning-500 text-warning-500" />}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-slate-400">até {formatTime(event.endAt)}</span>
          <Badge color={PRIORITY_COLOR[event.priority]} className="hidden xs:inline-flex">
            {PRIORITY_LABEL[event.priority]}
          </Badge>
        </div>
      </div>
    </button>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const { openEventModal } = useUIStore();
  return (
    <button
      onClick={() => openEventModal(event)}
      className="flex w-full items-center gap-2.5 rounded-xl px-1.5 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.08] sm:gap-3 sm:px-2"
    >
      <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: event.color }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{event.title}</p>
        <p className="truncate text-xs text-slate-400">{formatFullDate(event.startAt)} · {formatTime(event.startAt)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {event.isFavorite && <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" />}
        <Badge color={PRIORITY_COLOR[event.priority]} className="hidden xs:inline-flex">
          {PRIORITY_LABEL[event.priority]}
        </Badge>
      </div>
    </button>
  );
}

const QUICK_ACTIONS = [
  { label: "Novo evento", icon: CalendarPlus, to: "event" as const },
  { label: "Nova tarefa", icon: ListPlus, to: "/tasks?new=1" },
  { label: "Modo foco", icon: Timer, to: "/focus" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();
  const { openEventModal } = useUIStore();
  const navigate = useNavigate();

  if (isLoading || !data) return <Loading label="Montando seu painel..." />;

  const firstName = user?.name?.split(" ")[0];
  const todayLabel = formatFullDate(new Date().toISOString());

  return (
    <div className="space-y-5 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 p-5 text-white shadow-glass sm:rounded-3xl sm:p-7"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl sm:h-56 sm:w-56" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/70 sm:text-sm">{todayLabel}</p>
            <h1 className="mt-1 font-display text-xl font-bold sm:text-2xl">Olá, {firstName} 👋</h1>
            <p className="mt-1 text-sm text-white/80">Aqui está o resumo da sua rotina hoje.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => (action.to === "event" ? openEventModal() : navigate(action.to))}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-white/25 sm:text-sm"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Eventos hoje" value={data.todayEvents.length} icon={<CalendarClock className="h-5 w-5" />} accent="primary" />
        <StatCard label="Tarefas pendentes" value={data.pendingTasksCount} icon={<ListChecks className="h-5 w-5" />} accent="secondary" />
        <StatCard label="Itens atrasados" value={data.overdueEvents.length + data.overdueTasksCount} icon={<AlertTriangle className="h-5 w-5" />} accent="danger" />
        <StatCard label="Minutos produtivos hoje" value={data.productiveMinutesToday} icon={<Clock3 className="h-5 w-5" />} accent="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-5 sm:space-y-6 lg:col-span-2">
          <div className="card">
            <h3 className="mb-4 font-display font-semibold text-slate-700 dark:text-slate-200">Agenda de hoje</h3>
            {data.todayEvents.length === 0 ? (
              <EmptyState title="Nada agendado para hoje" description="Aproveite para planejar ou criar um novo evento." />
            ) : (
              <div className="space-y-1">
                {data.todayEvents.map((ev, idx) => (
                  <TimelineEventRow key={ev.id} event={ev} isLast={idx === data.todayEvents.length - 1} />
                ))}
              </div>
            )}
          </div>

          {data.overdueEvents.length > 0 && (
            <div className="card border-danger-200 dark:border-danger-500/20">
              <h3 className="mb-2 flex items-center gap-1.5 font-display font-semibold text-danger-600 dark:text-danger-400">
                <AlertTriangle className="h-4 w-4" /> Eventos atrasados
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-white/[0.08]">
                {data.overdueEvents.slice(0, 4).map((ev) => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="mb-2 font-display font-semibold text-slate-700 dark:text-slate-200">Próximos compromissos</h3>
            {data.upcomingEvents.length === 0 ? (
              <EmptyState title="Nenhum compromisso futuro" />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.08]">
                {data.upcomingEvents.slice(0, 5).map((ev) => (
                  <EventRow key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <MiniCalendar />
          <HabitsWidget />
          <NotesWidget />
        </div>
      </div>
    </div>
  );
}

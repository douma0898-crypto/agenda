import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { CalendarPlus, ListPlus, LayoutDashboard, BarChart3, CalendarDays, ListTodo, FolderKanban, Settings, Search, Target, Timer } from "lucide-react";
import { useUIStore } from "@/contexts/useUIStore";
import { useEvents } from "@/hooks/useEvents";
import { useTasks } from "@/hooks/useTasks";
import { formatFullDate } from "@/utils/date";

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette, openEventModal } = useUIStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        useUIStore.getState().openCommandPalette();
      }
      if (e.key === "Escape") closeCommandPalette();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeCommandPalette]);

  const { data: events } = useEvents({ search: query || undefined });
  const { data: tasks } = useTasks({ search: query || undefined });

  const navItems = useMemo(
    () => [
      { label: "Ir para Dashboard", icon: LayoutDashboard, action: () => navigate("/") },
      { label: "Ir para Análises", icon: BarChart3, action: () => navigate("/analytics") },
      { label: "Ir para Calendário", icon: CalendarDays, action: () => navigate("/calendar") },
      { label: "Ir para Tarefas", icon: ListTodo, action: () => navigate("/tasks") },
      { label: "Ir para Hábitos", icon: Target, action: () => navigate("/habits") },
      { label: "Ir para Modo Foco", icon: Timer, action: () => navigate("/focus") },
      { label: "Ir para Categorias", icon: FolderKanban, action: () => navigate("/categories") },
      { label: "Ir para Configurações", icon: Settings, action: () => navigate("/settings") },
      { label: "Criar novo evento", icon: CalendarPlus, action: () => openEventModal() },
      { label: "Criar nova tarefa", icon: ListPlus, action: () => navigate("/tasks?new=1") },
    ],
    [navigate, openEventModal]
  );

  const filteredNav = navItems.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()));

  if (!commandPaletteOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-16 sm:pt-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeCommandPalette} />
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl glass-panel rounded-2xl overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-white/10 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar eventos, tarefas ou digitar um comando..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredNav.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Navegação</p>
                {filteredNav.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      closeCommandPalette();
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                  >
                    <item.icon className="h-4 w-4 text-primary-500" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {query && events && events.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Eventos</p>
                {events.slice(0, 5).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => {
                      openEventModal(ev);
                      closeCommandPalette();
                      setQuery("");
                    }}
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{ev.title}</span>
                    <span className="text-xs text-slate-400">{formatFullDate(ev.startAt)}</span>
                  </button>
                ))}
              </div>
            )}

            {query && tasks && tasks.length > 0 && (
              <div>
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tarefas</p>
                {tasks.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      navigate("/tasks");
                      closeCommandPalette();
                      setQuery("");
                    }}
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.title}</span>
                  </button>
                ))}
              </div>
            )}

            {query && (!events || events.length === 0) && (!tasks || tasks.length === 0) && filteredNav.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-400">Nenhum resultado para "{query}"</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

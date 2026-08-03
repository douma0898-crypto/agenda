import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, ListTodo, MoreHorizontal, BarChart3,
  Target, Timer, FolderKanban, Settings, X, Link2, Users,
} from "lucide-react";
import clsx from "clsx";

const PRIMARY_ITEMS = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/calendar", label: "Agenda", icon: CalendarDays },
  { to: "/tasks", label: "Tarefas", icon: ListTodo },
];

const MORE_ITEMS = [
  { to: "/analytics", label: "Análises", icon: BarChart3 },
  { to: "/habits", label: "Hábitos", icon: Target },
  { to: "/focus", label: "Modo Foco", icon: Timer },
  { to: "/categories", label: "Categorias", icon: FolderKanban },
  { to: "/agendamentos", label: "Agendamentos", icon: Link2 },
  { to: "/colaboracao", label: "Colaboração", icon: Users },
  { to: "/settings", label: "Configurações", icon: Settings },
];

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isMoreActive = MORE_ITEMS.some((item) => location.pathname.startsWith(item.to));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around glass-panel border-t border-white/40 dark:border-white/[0.08] px-1 py-1.5 [padding-bottom:env(safe-area-inset-bottom)]">
        {PRIMARY_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                "flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium",
                isActive ? "text-primary-600 dark:text-primary-300" : "text-slate-400"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}

        <button
          onClick={() => setMoreOpen(true)}
          className={clsx(
            "flex min-w-[64px] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium",
            isMoreActive ? "text-primary-600 dark:text-primary-300" : "text-slate-400"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          Mais
        </button>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div className="fixed inset-0 z-40 flex items-end md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full rounded-t-3xl glass-panel p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-slate-700 dark:text-slate-200">Mais opções</span>
                <button onClick={() => setMoreOpen(false)} className="btn-ghost !p-1.5 rounded-full">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {MORE_ITEMS.map((item) => (
                  <button
                    key={item.to}
                    onClick={() => {
                      navigate(item.to);
                      setMoreOpen(false);
                    }}
                    className={clsx(
                      "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-colors",
                      location.pathname.startsWith(item.to)
                        ? "bg-primary-500/10 text-primary-600 dark:text-primary-300"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

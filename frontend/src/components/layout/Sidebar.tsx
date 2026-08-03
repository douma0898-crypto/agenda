import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  CalendarDays,
  ListTodo,
  FolderKanban,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  CalendarHeart,
  Target,
  Timer,
  Link2,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { useUIStore } from "@/contexts/useUIStore";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/analytics", label: "Análises", icon: BarChart3 },
  { to: "/calendar", label: "Calendário", icon: CalendarDays },
  { to: "/tasks", label: "Tarefas", icon: ListTodo },
  { to: "/habits", label: "Hábitos", icon: Target },
  { to: "/focus", label: "Modo Foco", icon: Timer },
  { to: "/categories", label: "Categorias", icon: FolderKanban },
  { to: "/agendamentos", label: "Agendamentos", icon: Link2 },
  { to: "/colaboracao", label: "Colaboração", icon: Users },
  { to: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 76 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="hidden md:flex h-screen flex-col glass-panel border-r border-white/40 dark:border-white/[0.08] px-3 py-5"
    >
      <div className={clsx("mb-8 flex items-center gap-2 px-2", sidebarCollapsed && "justify-center px-0")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-md">
          <CalendarHeart className="h-5 w-5" />
        </div>
        {!sidebarCollapsed && <span className="font-display text-lg font-bold text-slate-800 dark:text-white">Agenda</span>}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-500/10 text-primary-600 dark:text-primary-300"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-700 dark:hover:text-slate-200",
                sidebarCollapsed && "justify-center"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggleSidebar}
        className="btn-ghost mt-2 justify-center rounded-xl"
        aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}

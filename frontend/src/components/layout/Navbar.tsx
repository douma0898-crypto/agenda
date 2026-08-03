import { useNavigate } from "react-router-dom";
import { Moon, Sun, Plus, Command, LogOut, UserCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUIStore } from "@/contexts/useUIStore";
import { Avatar } from "@/components/ui/Primitives";
import { Dropdown } from "@/components/ui/Dropdown";
import { NotificationsBell } from "@/components/layout/NotificationsBell";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { openCommandPalette, openEventModal } = useUIStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 glass-panel border-b border-white/40 dark:border-white/[0.08] px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
      <button
        onClick={openCommandPalette}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] px-2.5 py-2 text-sm text-slate-400 transition-colors hover:border-primary-300 sm:max-w-sm sm:px-3.5"
      >
        <Command className="h-4 w-4 shrink-0" />
        <span className="hidden truncate sm:inline">Pesquisar ou executar um comando...</span>
        <span className="truncate sm:hidden">Pesquisar...</span>
        <kbd className="ml-auto hidden shrink-0 rounded-md bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button onClick={() => openEventModal()} className="btn-primary !px-3 sm:!px-4">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo evento</span>
        </button>

        <button onClick={toggleTheme} className="btn-ghost !p-2 rounded-full sm:!p-2.5" aria-label="Alternar tema">
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        <NotificationsBell />

        <Dropdown
          align="right"
          trigger={<Avatar name={user?.name || "?"} url={user?.avatarUrl} />}
          options={[
            { label: "Meu perfil", value: "profile", icon: <UserCircle className="h-4 w-4" /> },
            { label: "Sair", value: "logout", icon: <LogOut className="h-4 w-4" />, danger: true },
          ]}
          onSelect={(value) => {
            if (value === "profile") navigate("/settings");
            if (value === "logout") {
              logout();
              navigate("/login");
            }
          }}
        />
      </div>
    </header>
  );
}

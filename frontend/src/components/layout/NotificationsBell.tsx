import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications, useNotificationMutations } from "@/hooks/useExtras";
import { EmptyState } from "@/components/ui/Primitives";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useNotifications();
  const { markRead, markAllRead, remove } = useNotificationMutations();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost relative !p-2.5 rounded-full" aria-label="Notificações">
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl glass-panel"
          >
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notificações</span>
              {unreadCount > 0 && (
                <button onClick={() => markAllRead.mutate()} className="flex items-center gap-1 text-xs text-primary-500 hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!data || data.items.length === 0 ? (
                <EmptyState icon={<Bell className="h-5 w-5" />} title="Nenhuma notificação" />
              ) : (
                data.items.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={`group flex cursor-pointer items-start gap-2 border-b border-slate-100/60 dark:border-white/[0.08] px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.08] ${!n.read ? "bg-primary-50/50 dark:bg-primary-500/5" : ""}`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-primary-500" : "bg-transparent"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{n.title}</p>
                      {n.message && <p className="truncate text-xs text-slate-400">{n.message}</p>}
                      <p className="text-[11px] text-slate-300">{timeAgo(n.createdAt)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove.mutate(n.id);
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-danger-500" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { ReactNode, useEffect, useState } from "react";
import clsx from "clsx";
import { Loader2, Inbox } from "lucide-react";
import { motion } from "framer-motion";

export function Badge({ children, color = "#3454D1", className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={clsx("badge", className)}
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, url, size = 36 }: { name: string; url?: string | null; size?: number }) {
  const [hasError, setHasError] = useState(false);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    setHasError(false);
  }, [url]);

  if (url && !hasError) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 text-xs font-semibold text-white"
    >
      {initials || "?"}
    </div>
  );
}

export function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-lg bg-slate-200/70 dark:bg-white/[0.06]", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 dark:bg-white/[0.06] text-primary-500">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {description && <p className="max-w-xs text-sm text-slate-400">{description}</p>}
      {action}
    </motion.div>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}

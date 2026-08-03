import { ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: "primary" | "secondary" | "warning" | "danger" | "success";
  hint?: string;
}

const accentClass: Record<string, string> = {
  primary: "bg-primary-500/10 text-primary-600 dark:text-primary-300",
  secondary: "bg-secondary-500/10 text-secondary-600 dark:text-secondary-400",
  warning: "bg-warning-500/10 text-warning-600 dark:text-warning-400",
  danger: "bg-danger-500/10 text-danger-600 dark:text-danger-400",
  success: "bg-success-500/10 text-success-600 dark:text-success-400",
};

export function StatCard({ label, value, icon, accent = "primary", hint }: StatCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} className="card flex items-start gap-4">
      <div className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", accentClass[accent])}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </motion.div>
  );
}

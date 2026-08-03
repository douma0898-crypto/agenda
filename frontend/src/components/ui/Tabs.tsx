import clsx from "clsx";
import { motion } from "framer-motion";

interface TabsProps {
  tabs: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.06] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            "relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
            active === tab.value ? "text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          {active === tab.value && (
            <motion.span
              layoutId="tab-pill"
              className="absolute inset-0 rounded-lg bg-primary-500"
              transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

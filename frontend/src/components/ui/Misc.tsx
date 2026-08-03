import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search as SearchIcon, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

export function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200/70 dark:border-white/10 py-2">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-200">
        {title}
        <ChevronDown className={clsx("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3 pt-1 text-sm text-slate-500 dark:text-slate-400">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Pesquisar..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9"
      />
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2">
      <button className="btn-ghost !p-2 rounded-full" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Página {page} de {totalPages}
      </span>
      <button className="btn-ghost !p-2 rounded-full" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { getMonthGrid, isSameMonth, isSameDay, addMonths, subMonths, formatDay, formatMonthYear } from "@/utils/date";

export function MiniCalendar() {
  const [reference, setReference] = useState(new Date());
  const navigate = useNavigate();
  const days = getMonthGrid(reference);

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-slate-700 dark:text-slate-200">{formatMonthYear(reference)}</span>
        <div className="flex gap-1">
          <button onClick={() => setReference((d) => subMonths(d, 1))} className="btn-ghost !p-1.5 rounded-full">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setReference((d) => addMonths(d, 1))} className="btn-ghost !p-1.5 rounded-full">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-slate-400">
            {d}
          </span>
        ))}
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => navigate("/calendar")}
            className={clsx(
              "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors",
              isSameDay(day, new Date())
                ? "bg-primary-500 font-semibold text-white"
                : isSameMonth(day, reference)
                ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                : "text-slate-300 dark:text-slate-600"
            )}
          >
            {formatDay(day)}
          </button>
        ))}
      </div>
    </div>
  );
}

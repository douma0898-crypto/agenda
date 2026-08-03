import { useMemo, useState, DragEvent } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Star } from "lucide-react";
import { getMonthGrid, isSameMonth, isSameDay, formatDay, formatWeekdayShort, formatTime } from "@/utils/date";
import { CalendarEvent } from "@/utils/types";
import { useUIStore } from "@/contexts/useUIStore";
import { useEventMutations } from "@/hooks/useEvents";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

interface MonthViewProps {
  referenceDate: Date;
  events: CalendarEvent[];
}

export function MonthView({ referenceDate, events }: MonthViewProps) {
  const days = useMemo(() => getMonthGrid(referenceDate), [referenceDate]);
  const { openEventModal } = useUIStore();
  const { move } = useEventMutations();
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = new Date(ev.startAt).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [events]);

  const handleDrop = (day: Date, ev: CalendarEvent) => {
    const start = new Date(ev.startAt);
    const end = new Date(ev.endAt);
    const duration = end.getTime() - start.getTime();
    const newStart = new Date(day);
    newStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);
    move.mutate({ id: ev.id, startAt: newStart.toISOString(), endAt: newEnd.toISOString() });
  };

  return (
    <div className="overflow-hidden rounded-2xl glass-panel">
      <div className="grid grid-cols-7 border-b border-slate-200/70 dark:border-white/10">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = day.toDateString();
          const dayEvents = eventsByDay.get(key) || [];
          const inMonth = isSameMonth(day, referenceDate);
          const today = isSameDay(day, new Date());
          const isDragOver = dragOverDay === key;

          return (
            <div
              key={key}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverDay(key);
              }}
              onDragLeave={() => setDragOverDay((prev) => (prev === key ? null : prev))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverDay(null);
                const eventId = e.dataTransfer.getData("text/event-id");
                const ev = events.find((ev) => ev.id === eventId);
                if (ev) handleDrop(day, ev);
              }}
              onClick={() => openEventModal(null, day)}
              className={clsx(
                "group relative min-h-[76px] cursor-pointer border-b border-r border-slate-100/80 dark:border-white/[0.08] p-1 transition-colors last:border-r-0 sm:min-h-[104px] sm:p-1.5",
                !inMonth && "bg-slate-50/50 dark:bg-black/10",
                isDragOver && "bg-primary-50 dark:bg-primary-500/10"
              )}
            >
              <div className="mb-1 flex items-center justify-between px-0.5">
                <span
                  className={clsx(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    today
                      ? "bg-primary-500 text-white shadow-glow"
                      : inMonth
                      ? "text-slate-600 dark:text-slate-300"
                      : "text-slate-300 dark:text-slate-600"
                  )}
                >
                  {formatDay(day)}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <motion.div
                    key={ev.id}
                    layout
                    draggable
                    onDragStart={(e: DragEvent<HTMLDivElement>) => e.dataTransfer.setData("text/event-id", ev.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventModal(ev);
                    }}
                    className="flex items-center gap-1 truncate rounded-md border-l-[3px] bg-white/80 dark:bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium shadow-sm hover:shadow-md transition-shadow"
                    style={{ borderColor: ev.color }}
                  >
                    {ev.isFavorite && <Star className="h-2.5 w-2.5 shrink-0 fill-warning-500 text-warning-500" />}
                    <span className="shrink-0 text-slate-400">{formatTime(ev.startAt)}</span>
                    <span className="truncate text-slate-700 dark:text-slate-200">{ev.title}</span>
                  </motion.div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="px-1.5 text-[10px] font-medium text-primary-500">+{dayEvents.length - 3} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

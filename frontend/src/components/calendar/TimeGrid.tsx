import { useMemo, useRef, useState, MouseEvent as ReactMouseEvent } from "react";
import clsx from "clsx";
import { Star } from "lucide-react";
import { isSameDay, formatWeekdayShort, formatDay } from "@/utils/date";
import { CalendarEvent } from "@/utils/types";
import { useUIStore } from "@/contexts/useUIStore";
import { useEventMutations } from "@/hooks/useEvents";

const HOUR_HEIGHT = 56; // px por hora
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface TimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  showDayHeader?: boolean;
}

interface DragState {
  eventId: string;
  mode: "move" | "resize";
  startY: number;
  originalStart: Date;
  originalEnd: Date;
  dayIndex: number;
}

function minutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function TimeGrid({ days, events, showDayHeader = true }: TimeGridProps) {
  const { openEventModal } = useUIStore();
  const { move } = useEventMutations();
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [previewMinutes, setPreviewMinutes] = useState<{ start: number; end: number } | null>(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) map.set(day.toDateString(), []);
    for (const ev of events) {
      const key = new Date(ev.startAt).toDateString();
      if (map.has(key)) map.get(key)!.push(ev);
    }
    return map;
  }, [days, events]);

  const pxToMinutes = (px: number) => Math.round((px / HOUR_HEIGHT) * 60 / 15) * 15;

  const onMouseDownEvent = (e: ReactMouseEvent, ev: CalendarEvent, mode: "move" | "resize", dayIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDrag({
      eventId: ev.id,
      mode,
      startY: e.clientY,
      originalStart: new Date(ev.startAt),
      originalEnd: new Date(ev.endAt),
      dayIndex,
    });
  };

  const onMouseMove = (e: ReactMouseEvent) => {
    if (!drag) return;
    const deltaMinutes = pxToMinutes(e.clientY - drag.startY);

    if (drag.mode === "move") {
      const newStart = minutesFromMidnight(drag.originalStart) + deltaMinutes;
      const duration = (drag.originalEnd.getTime() - drag.originalStart.getTime()) / 60000;
      setPreviewMinutes({ start: Math.max(0, newStart), end: Math.max(0, newStart) + duration });
    } else {
      const newEnd = minutesFromMidnight(drag.originalEnd) + deltaMinutes;
      setPreviewMinutes({ start: minutesFromMidnight(drag.originalStart), end: Math.max(minutesFromMidnight(drag.originalStart) + 15, newEnd) });
    }
  };

  const onMouseUp = () => {
    if (!drag || !previewMinutes) {
      setDrag(null);
      setPreviewMinutes(null);
      return;
    }

    const day = days[drag.dayIndex];
    const newStart = new Date(day);
    newStart.setHours(0, previewMinutes.start, 0, 0);
    const newEnd = new Date(day);
    newEnd.setHours(0, previewMinutes.end, 0, 0);

    move.mutate({ id: drag.eventId, startAt: newStart.toISOString(), endAt: newEnd.toISOString() });
    setDrag(null);
    setPreviewMinutes(null);
  };

  const handleSlotClick = (day: Date, hour: number) => {
    const date = new Date(day);
    date.setHours(hour, 0, 0, 0);
    openEventModal(null, date);
  };

  return (
    <div className="overflow-hidden rounded-2xl glass-panel">
      <div className="overflow-x-auto">
        <div style={{ minWidth: days.length > 1 ? `${56 + days.length * 96}px` : undefined }}>
          {showDayHeader && (
            <div className="grid border-b border-slate-200/70 dark:border-white/10" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
              <div />
              {days.map((day) => (
                <div key={day.toISOString()} className="border-l border-slate-100/70 dark:border-white/[0.08] px-2 py-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{formatWeekdayShort(day)}</p>
                  <p
                    className={clsx(
                      "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                      isSameDay(day, new Date()) ? "bg-primary-500 text-white" : "text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {formatDay(day)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div
            ref={containerRef}
            className="relative max-h-[60vh] overflow-y-auto sm:max-h-[600px]"
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={() => {
              if (drag) onMouseUp();
            }}
          >
            <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
              <div>
                {HOURS.map((h) => (
                  <div key={h} style={{ height: HOUR_HEIGHT }} className="border-b border-slate-100/60 dark:border-white/[0.08] pr-2 text-right text-[10px] text-slate-400">
                    {h.toString().padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {days.map((day, dayIndex) => (
                <div key={day.toISOString()} className="relative border-l border-slate-100/70 dark:border-white/[0.08]">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{ height: HOUR_HEIGHT }}
                      onClick={() => handleSlotClick(day, h)}
                      className="cursor-pointer border-b border-slate-100/60 dark:border-white/[0.08] hover:bg-primary-50/40 dark:hover:bg-white/[0.08]"
                    />
                  ))}

                  {(eventsByDay.get(day.toDateString()) || []).map((ev) => {
                    const isDragging = drag?.eventId === ev.id;
                    const startMin = isDragging && previewMinutes ? previewMinutes.start : minutesFromMidnight(new Date(ev.startAt));
                    const endMin = isDragging && previewMinutes ? previewMinutes.end : minutesFromMidnight(new Date(ev.endAt));
                    const top = (startMin / 60) * HOUR_HEIGHT;
                    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20);

                    return (
                      <div
                        key={ev.id}
                        onMouseDown={(e) => onMouseDownEvent(e, ev, "move", dayIndex)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDragging) openEventModal(ev);
                        }}
                        className="absolute left-1 right-1 z-10 cursor-grab overflow-hidden rounded-lg border-l-[3px] bg-white/90 dark:bg-white/10 px-2 py-1 text-[11px] shadow-sm active:cursor-grabbing"
                        style={{ top, height, borderColor: ev.color }}
                      >
                        <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                          {ev.isFavorite && <Star className="h-2.5 w-2.5 shrink-0 fill-warning-500 text-warning-500" />}
                          <span className="truncate">{ev.title}</span>
                        </div>
                        <div
                          onMouseDown={(e) => onMouseDownEvent(e, ev, "resize", dayIndex)}
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

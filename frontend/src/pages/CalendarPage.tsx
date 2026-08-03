import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Download, Upload } from "lucide-react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays as fnsAddDays } from "date-fns";
import { addMonths, subMonths, formatMonthYear, formatFullDate, formatTime, getWeekDays, PRIORITY_COLOR } from "@/utils/date";
import { useEvents } from "@/hooks/useEvents";
import { MonthView } from "@/components/calendar/MonthView";
import { TimeGrid } from "@/components/calendar/TimeGrid";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { Loading, EmptyState, Badge } from "@/components/ui/Primitives";
import { Dropdown } from "@/components/ui/Dropdown";
import { useUIStore } from "@/contexts/useUIStore";
import { exportService, importService } from "@/services/extraServices";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

type View = "month" | "week" | "day" | "agenda";

export default function CalendarPage() {
  const [reference, setReference] = useState(new Date());
  const [view, setView] = useState<View>("month");
  const { openEventModal } = useUIStore();
  const queryClient = useQueryClient();

  const { rangeStart, rangeEnd, days } = useMemo(() => {
    if (view === "week") {
      const weekDays = getWeekDays(reference);
      return { rangeStart: weekDays[0], rangeEnd: fnsAddDays(weekDays[6], 1), days: weekDays };
    }
    if (view === "day") {
      return { rangeStart: reference, rangeEnd: fnsAddDays(reference, 1), days: [reference] };
    }
    return {
      rangeStart: startOfWeek(startOfMonth(reference), { weekStartsOn: 0 }),
      rangeEnd: endOfWeek(endOfMonth(reference), { weekStartsOn: 0 }),
      days: [] as Date[],
    };
  }, [view, reference]);

  const { data: events, isLoading } = useEvents({
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString(),
  });

  const sortedEvents = useMemo(() => [...(events || [])].sort((a, b) => a.startAt.localeCompare(b.startAt)), [events]);

  const navigate = (dir: 1 | -1) => {
    if (view === "month") setReference((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
    else if (view === "week") setReference((d) => fnsAddDays(d, dir * 7));
    else setReference((d) => fnsAddDays(d, dir));
  };

  const headerLabel = view === "month" ? formatMonthYear(reference) : formatFullDate(reference.toISOString());

  const handleImportFile = async (file: File) => {
    try {
      const result = await importService.eventsCsv(file);
      toast.success(result.message || "Importação concluída");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    } catch {
      toast.error("Não foi possível importar o arquivo");
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <h1 className="truncate font-display text-lg font-bold text-slate-800 dark:text-white sm:text-xl">{headerLabel}</h1>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => navigate(-1)} className="btn-ghost !p-2 rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setReference(new Date())} className="btn-secondary !px-3 !py-1.5 text-xs">
                Hoje
              </button>
              <button onClick={() => navigate(1)} className="btn-ghost !p-2 rounded-full">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Button onClick={() => openEventModal()} className="!px-3 sm:!px-4">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo evento</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="scrollbar-hide -mx-1 overflow-x-auto px-1">
            <Tabs
              tabs={[
                { label: "Mês", value: "month" },
                { label: "Semana", value: "week" },
                { label: "Dia", value: "day" },
                { label: "Agenda", value: "agenda" },
              ]}
              active={view}
              onChange={(v) => setView(v as View)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Dropdown
              align="right"
              trigger={
                <button className="btn-secondary !px-3">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              }
              options={[
                { label: "Exportar CSV", value: "csv" },
                { label: "Exportar Excel", value: "xlsx" },
                { label: "Exportar PDF", value: "pdf" },
              ]}
              onSelect={(v) => {
                if (v === "csv") exportService.eventsCsv();
                if (v === "xlsx") exportService.eventsXlsx();
                if (v === "pdf") exportService.eventsPdf();
              }}
            />

            <label className="btn-secondary cursor-pointer !px-3">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar CSV</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading label="Carregando eventos..." />
      ) : view === "month" ? (
        <MonthView referenceDate={reference} events={events || []} />
      ) : view === "week" ? (
        <TimeGrid days={days} events={events || []} />
      ) : view === "day" ? (
        <TimeGrid days={days} events={events || []} />
      ) : (
        <div className="card">
          {sortedEvents.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="Nenhum evento neste período" />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.08]">
              {sortedEvents.map((ev) => (
                <button
                  key={ev.id + ev.startAt}
                  onClick={() => openEventModal(ev)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.08]"
                >
                  <span className="h-10 w-1 shrink-0 rounded-full" style={{ backgroundColor: ev.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{ev.title}</p>
                    <p className="truncate text-xs text-slate-400">
                      {formatFullDate(ev.startAt)} · {formatTime(ev.startAt)} — {formatTime(ev.endAt)}
                    </p>
                  </div>
                  <Badge color={PRIORITY_COLOR[ev.priority]}>{ev.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { Flame, Trophy, Clock, TrendingDown, TrendingUp, FileDown, Award } from "lucide-react";
import { ExecutiveDashboardData } from "@/services/analyticsExecService";
import { exportService } from "@/services/extraServices";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function ProductivityHeatmap({ cells }: { cells: ExecutiveDashboardData["heatmap"] }) {
  const grid = new Map<string, ExecutiveDashboardData["heatmap"][number]>();
  cells.forEach((c) => grid.set(`${c.weekday}-${c.hour}`, c));

  return (
    <div className="card overflow-x-auto">
      <h3 className="mb-3 font-display font-semibold text-slate-700 dark:text-slate-200">Heatmap de produtividade</h3>
      <div className="min-w-[560px]">
        <div className="mb-1 grid grid-cols-[40px_repeat(24,1fr)] gap-[2px] text-[10px] text-slate-400">
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-center">{h % 3 === 0 ? h : ""}</div>
          ))}
        </div>
        {WEEKDAYS.map((label, weekday) => (
          <div key={weekday} className="grid grid-cols-[40px_repeat(24,1fr)] gap-[2px]">
            <div className="flex items-center text-[10px] font-medium text-slate-400">{label}</div>
            {HOURS.map((hour) => {
              const cell = grid.get(`${weekday}-${hour}`);
              const intensity = cell?.intensity || 0;
              return (
                <div
                  key={hour}
                  title={`${label} ${hour}h — ${cell?.minutes || 0} min`}
                  className="aspect-square rounded-sm"
                  style={{
                    backgroundColor:
                      intensity === 0
                        ? "rgba(148,163,184,0.12)"
                        : `rgba(79,70,229,${0.15 + intensity * 0.75})`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function StreakCard({ streak }: { streak: ExecutiveDashboardData["streak"] }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-500/15 text-secondary-500">
        <Flame className="h-6 w-6" />
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-slate-800 dark:text-white">{streak.currentStreak} dias</p>
        <p className="text-xs text-slate-400">Sequência atual · recorde de {streak.bestStreak} dias</p>
      </div>
    </div>
  );
}

function TimeLostFocusedCard({ data }: { data: ExecutiveDashboardData["timeLostVsFocused"] }) {
  return (
    <div className="card">
      <h3 className="mb-3 font-display font-semibold text-slate-700 dark:text-slate-200">Tempo focado x perdido (30 dias)</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-primary-500/10 p-3.5">
          <div className="mb-1 flex items-center gap-1.5 text-primary-600 dark:text-primary-300">
            <TrendingUp className="h-4 w-4" /> <span className="text-xs font-semibold">Focado</span>
          </div>
          <p className="font-display text-xl font-bold text-slate-800 dark:text-white">{data.focusedHours}h</p>
        </div>
        <div className="rounded-xl bg-danger-500/10 p-3.5">
          <div className="mb-1 flex items-center gap-1.5 text-danger-500">
            <TrendingDown className="h-4 w-4" /> <span className="text-xs font-semibold">Perdido</span>
          </div>
          <p className="font-display text-xl font-bold text-slate-800 dark:text-white">{data.lostHours}h</p>
        </div>
      </div>
    </div>
  );
}

function CategoryRankingCard({ ranking }: { ranking: ExecutiveDashboardData["categoryRanking"] }) {
  return (
    <div className="card">
      <h3 className="mb-3 font-display font-semibold text-slate-700 dark:text-slate-200">Ranking de categorias</h3>
      {ranking.length === 0 ? (
        <p className="text-sm text-slate-400">Sem dados suficientes ainda.</p>
      ) : (
        <ul className="space-y-2">
          {ranking.slice(0, 6).map((c) => (
            <li key={c.categoryId} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">#{c.rank}</span>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="flex-1 truncate text-sm text-slate-600 dark:text-slate-300">{c.name}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{c.hours}h</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductiveHoursAndDaysCard({
  hours, days,
}: { hours: ExecutiveDashboardData["mostProductiveHours"]; days: ExecutiveDashboardData["busiestDays"] }) {
  return (
    <div className="card">
      <h3 className="mb-3 font-display font-semibold text-slate-700 dark:text-slate-200">Horários & dias mais ocupados</h3>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {hours.map((h) => (
          <span key={h.hour} className="rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-medium text-primary-600 dark:text-primary-300">
            {h.label}
          </span>
        ))}
      </div>
      <ul className="space-y-1.5 text-sm">
        {days.slice(0, 4).map((d) => (
          <li key={d.date} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>{new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR")}</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{d.eventsCount} eventos</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AchievementsCard({ achievements }: { achievements: ExecutiveDashboardData["achievements"] }) {
  return (
    <div className="card sm:col-span-2">
      <h3 className="mb-3 flex items-center gap-2 font-display font-semibold text-slate-700 dark:text-slate-200">
        <Trophy className="h-4 w-4 text-secondary-500" /> Conquistas
      </h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
        {achievements.map((a) => (
          <div
            key={a.id}
            title={a.description}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-opacity ${
              a.unlocked
                ? "border-secondary-500/30 bg-secondary-500/10"
                : "border-slate-100 opacity-40 dark:border-white/10"
            }`}
          >
            <Award className={`h-5 w-5 ${a.unlocked ? "text-secondary-500" : "text-slate-400"}`} />
            <span className="text-[11px] font-medium leading-tight text-slate-600 dark:text-slate-300">{a.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExecutiveDashboard({ data }: { data: ExecutiveDashboardData }) {
  const [exporting, setExporting] = useState(false);

  async function handleExportPdf() {
    setExporting(true);
    try {
      await exportService.executiveReportPdf();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-slate-700 dark:text-slate-200">Dashboard Executivo</h2>
        <Button variant="secondary" onClick={handleExportPdf} loading={exporting}>
          <FileDown className="h-4 w-4" /> Relatório em PDF
        </Button>
      </div>

      <ProductivityHeatmap cells={data.heatmap} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StreakCard streak={data.streak} />
        <TimeLostFocusedCard data={data.timeLostVsFocused} />
        <CategoryRankingCard ranking={data.categoryRanking} />
        <ProductiveHoursAndDaysCard hours={data.mostProductiveHours} days={data.busiestDays} />
        <AchievementsCard achievements={data.achievements} />
      </div>
    </div>
  );
}

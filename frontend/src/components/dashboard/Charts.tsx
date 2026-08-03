import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, CheckCircle2, Clock3, Zap, TrendingUp, TrendingDown, Minus, ListChecks, CheckCheck } from "lucide-react";
import {
  MonthlyEvolutionPoint,
  CategoryDistributionEntry,
  TaskTrendPoint,
  MonthSummary,
  QuarterSummaryEntry,
  SemesterSummaryEntry,
} from "@/utils/types";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";

const GRID_STROKE = "rgb(var(--chart-grid) / 0.5)";
const AXIS_STROKE = "rgb(var(--chart-axis) / 0.85)";
const CURSOR_FILL = { fill: "rgb(var(--color-primary-500) / 0.06)" };

export function MonthlyEvolutionChart({ data }: { data: MonthlyEvolutionPoint[] }) {
  const hasData = data.some((d) => d.productiveHours || d.eventsCount || d.tasksCompletedCount);

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Evolução Mensal</h3>
          <p className="text-xs text-slate-400">Horas produtivas, eventos e tarefas dos últimos 6 meses</p>
        </div>
      </div>
      {!hasData ? (
        <p className="py-16 text-center text-sm text-slate-400">Ainda não há dados suficientes para os últimos 6 meses.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ left: -16 }}>
            <defs>
              <linearGradient id="barProductive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#22C55E" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="barEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C2703D" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#C2703D" stopOpacity={0.55} />
              </linearGradient>
              <linearGradient id="barTasks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C8DB5" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#7C8DB5" stopOpacity={0.55} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke={AXIS_STROKE} />
            <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={12} stroke={AXIS_STROKE} />
            <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={12} stroke={AXIS_STROKE} domain={[0, 100]} hide />
            <Tooltip content={<ChartTooltip />} cursor={CURSOR_FILL} />
            <Legend
              verticalAlign="bottom"
              height={32}
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) =>
                ({ productiveHours: "Horas Produtivas", eventsCount: "Eventos", tasksCompletedCount: "Tarefas Concluídas", avgFocus: "Foco Médio (%)" }[
                  value
                ] || value)
              }
            />
            <Bar yAxisId="left" dataKey="productiveHours" fill="url(#barProductive)" radius={[4, 4, 0, 0]} barSize={16} name="Horas Produtivas" />
            <Bar yAxisId="left" dataKey="eventsCount" fill="url(#barEvents)" radius={[4, 4, 0, 0]} barSize={16} name="Eventos" />
            <Bar yAxisId="left" dataKey="tasksCompletedCount" fill="url(#barTasks)" radius={[4, 4, 0, 0]} barSize={16} name="Tarefas Concluídas" />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgFocus"
              name="Foco Médio (%)"
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#F59E0B", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function CategoryDistributionChart({ data }: { data: CategoryDistributionEntry[] }) {
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Distribuição por Categoria</h3>
        <p className="text-xs text-slate-400">Horas produtivas por categoria (último mês)</p>
      </div>

      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">Nenhuma hora registrada por categoria ainda.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="hours"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}h`} />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2">
            {data.map((entry) => (
              <div key={entry.categoryId} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="truncate text-slate-600 dark:text-slate-300">{entry.name}</span>
                </span>
                <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200">{entry.hours}h</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TaskTrendChart({ data }: { data: TaskTrendPoint[] }) {
  const hasData = data.some((d) => d.created || d.completed);

  const totalCreated = data.reduce((sum, d) => sum + d.created, 0);
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
  const completionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  const half = Math.ceil(data.length / 2);
  const firstHalfNet = data.slice(0, half).reduce((sum, d) => sum + (d.completed - d.created), 0);
  const secondHalfNet = data.slice(half).reduce((sum, d) => sum + (d.completed - d.created), 0);
  const trendDelta = secondHalfNet - firstHalfNet;
  const TrendIcon = trendDelta > 0 ? TrendingUp : trendDelta < 0 ? TrendingDown : Minus;
  const trendColor = trendDelta > 0 ? "text-success-600 dark:text-success-400" : trendDelta < 0 ? "text-danger-500" : "text-slate-400";

  return (
    <div className="card">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Tendência de Tarefas</h3>
          <p className="text-xs text-slate-400">Criadas vs concluídas nas últimas 8 semanas</p>
        </div>
        {hasData && (
          <div className={`flex items-center gap-1 rounded-full bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendDelta === 0 ? "Estável" : trendDelta > 0 ? "Melhorando" : "Piorando"}
          </div>
        )}
      </div>

      {!hasData ? (
        <p className="py-16 text-center text-sm text-slate-400">Ainda não há tarefas suficientes para mostrar uma tendência.</p>
      ) : (
        <>
          <div className="my-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 dark:bg-white/[0.04] p-3">
            <div className="text-center">
              <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400">
                <ListChecks className="h-3 w-3" /> Criadas
              </p>
              <p className="font-display text-lg font-bold text-slate-700 dark:text-slate-100">{totalCreated}</p>
            </div>
            <div className="text-center border-x border-slate-200/70 dark:border-white/[0.08]">
              <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400">
                <CheckCheck className="h-3 w-3" /> Concluídas
              </p>
              <p className="font-display text-lg font-bold text-success-600 dark:text-success-400">{totalCompleted}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium text-slate-400">Taxa</p>
              <p className="font-display text-lg font-bold text-primary-600 dark:text-primary-300">{completionRate}%</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ left: -16, top: 8 }}>
              <defs>
                <linearGradient id="areaCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="areaCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--color-primary-500))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="rgb(var(--color-primary-500))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="weekLabel" tickLine={false} axisLine={false} fontSize={11} stroke={AXIS_STROKE} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke={AXIS_STROKE} allowDecimals={false} width={28} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={28}
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => ({ completed: "Concluídas", created: "Criadas" }[value] || value)}
              />
              <Area
                type="monotone"
                dataKey="created"
                name="Criadas"
                stroke="rgb(var(--color-primary-500))"
                strokeWidth={2.5}
                fill="url(#areaCreated)"
                dot={{ r: 3, strokeWidth: 0, fill: "rgb(var(--color-primary-500))" }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Concluídas"
                stroke="#22C55E"
                strokeWidth={2.5}
                fill="url(#areaCompleted)"
                dot={{ r: 3, strokeWidth: 0, fill: "#22C55E" }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

export function QuarterSemesterCard({
  quarterSummary,
  semesterSummary,
}: {
  quarterSummary: QuarterSummaryEntry[];
  semesterSummary: SemesterSummaryEntry[];
}) {
  const hasData = quarterSummary.length > 0 || semesterSummary.length > 0;

  const renderPanels = (items: { label: string; hours: number; events: number; completed: number; focus: number }[]) => (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-300">{item.hours}h</p>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {item.events} eventos · {item.completed} tarefas · {item.focus}% foco médio
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Trimestres e Semestres</h3>
        <p className="text-xs text-slate-400">Comparativo dos últimos trimestres e semestres</p>
      </div>
      {!hasData ? (
        <p className="py-16 text-center text-sm text-slate-400">Ainda não há dados suficientes para a visão trimestral/semestral.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trimestres</p>
            {renderPanels(quarterSummary.map((q) => ({
              label: q.quarterLabel,
              hours: q.productiveHours,
              events: q.eventsCount,
              completed: q.tasksCompletedCount,
              focus: q.avgFocus,
            })))}
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Semestres</p>
            {renderPanels(semesterSummary.map((s) => ({
              label: s.semesterLabel,
              hours: s.productiveHours,
              events: s.eventsCount,
              completed: s.tasksCompletedCount,
              focus: s.avgFocus,
            })))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MonthSummaryCard({ data, monthLabel }: { data: MonthSummary; monthLabel: string }) {
  const rows = [
    {
      icon: BarChart3,
      label: "Total de Eventos",
      hint: `${data.pendingEvents} pendente${data.pendingEvents === 1 ? "" : "s"}`,
      value: data.totalEvents,
      color: "text-primary-500 bg-primary-500/10",
    },
    {
      icon: CheckCircle2,
      label: "Taxa de Conclusão",
      hint: "Tarefas concluídas vs criadas",
      value: `${data.completionRate}%`,
      color: "text-success-600 dark:text-success-400 bg-success-500/10",
    },
    {
      icon: Clock3,
      label: "Média Diária",
      hint: "Horas produtivas/dia",
      value: `${data.dailyAverageHours}h`,
      color: "text-warning-600 dark:text-warning-400 bg-warning-500/10",
    },
    {
      icon: Zap,
      label: "Horas Totais (6m)",
      hint: "Acumulado do semestre",
      value: `${data.totalHours6m}h`,
      color: "text-secondary-600 dark:text-secondary-400 bg-secondary-500/10",
    },
  ];

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Resumo do Mês</h3>
        <p className="text-xs text-slate-400">{monthLabel} em números</p>
      </div>

      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 rounded-xl px-1 py-2.5">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${row.color}`}>
              <row.icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{row.label}</p>
              <p className="truncate text-xs text-slate-400">{row.hint}</p>
            </div>
            <span className="shrink-0 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRIORITY_COLORS: Record<string, string> = { low: "#64748B", medium: "#3B82F6", high: "#F59E0B", urgent: "#EF4444" };
const STATUS_COLORS: Record<string, string> = { pending: "#94A3B8", in_progress: "#3B82F6", done: "#22C55E" };

export function PriorityBreakdownChart({ data }: { data: { priority: string; label: string; count: number }[] }) {
  const hasData = data.some((d) => d.count > 0);
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Eventos por Prioridade</h3>
        <p className="text-xs text-slate-400">Distribuição dos últimos 90 dias</p>
      </div>
      {!hasData ? (
        <p className="py-14 text-center text-sm text-slate-400">Nenhum evento nos últimos 90 dias.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} stroke={AXIS_STROKE} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke={AXIS_STROKE} width={70} />
            <Tooltip content={<ChartTooltip />} cursor={CURSOR_FILL} />
            <Bar dataKey="count" name="Eventos" radius={[0, 6, 6, 0]} barSize={18}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={PRIORITY_COLORS[entry.priority] || "#94A3B8"} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function WeekdayActivityChart({ data }: { data: { weekday: string; count: number }[] }) {
  const hasData = data.some((d) => d.count > 0);
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Atividade por Dia da Semana</h3>
        <p className="text-xs text-slate-400">Eventos agendados nos últimos 90 dias</p>
      </div>
      {!hasData ? (
        <p className="py-14 text-center text-sm text-slate-400">Nenhum evento nos últimos 90 dias.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="barWeekday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--color-primary-500))" stopOpacity={0.95} />
                <stop offset="100%" stopColor="rgb(var(--color-primary-500))" stopOpacity={0.55} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="weekday" tickLine={false} axisLine={false} fontSize={12} stroke={AXIS_STROKE} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} stroke={AXIS_STROKE} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={CURSOR_FILL} />
            <Bar dataKey="count" name="Eventos" fill="url(#barWeekday)" radius={[6, 6, 0, 0]} barSize={28} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function StatusBreakdownChart({ data }: { data: { status: string; label: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Status das Tarefas</h3>
        <p className="text-xs text-slate-400">Todas as tarefas cadastradas</p>
      </div>
      {total === 0 ? (
        <p className="py-14 text-center text-sm text-slate-400">Nenhuma tarefa cadastrada ainda.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="label" innerRadius={50} outerRadius={75} paddingAngle={3}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={STATUS_COLORS[entry.status] || "#94A3B8"} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1">
            {data.map((entry) => (
              <span key={entry.status} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.status] }} />
                {entry.label} ({entry.count})
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function HabitConsistencyChart({ data }: { data: { habitId: string; name: string; color: string; percentage: number }[] }) {
  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-slate-700 dark:text-slate-200">Consistência de Hábitos</h3>
        <p className="text-xs text-slate-400">% de dias concluídos nos últimos 30 dias</p>
      </div>
      {data.length === 0 ? (
        <p className="py-14 text-center text-sm text-slate-400">Nenhum hábito cadastrado ainda.</p>
      ) : (
        <div className="space-y-3.5">
          {data.map((habit) => (
            <div key={habit.habitId}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">{habit.name}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{habit.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div className="h-full rounded-full transition-all" style={{ width: `${habit.percentage}%`, backgroundColor: habit.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

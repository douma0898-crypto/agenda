import { useQuery } from "@tanstack/react-query";
import { useDashboardAnalytics } from "@/hooks/useDashboard";
import {
  MonthlyEvolutionChart,
  QuarterSemesterCard,
  CategoryDistributionChart,
  TaskTrendChart,
  MonthSummaryCard,
  PriorityBreakdownChart,
  WeekdayActivityChart,
  StatusBreakdownChart,
  HabitConsistencyChart,
} from "@/components/dashboard/Charts";
import { ExecutiveDashboard } from "@/components/dashboard/ExecutiveDashboard";
import { executiveDashboardService } from "@/services/analyticsExecService";
import { Loading } from "@/components/ui/Primitives";
import { formatMonthYear } from "@/utils/date";

export default function AnalyticsPage() {
  const { data, isLoading } = useDashboardAnalytics();
  const { data: execData, isLoading: execLoading } = useQuery({
    queryKey: ["executive-dashboard"],
    queryFn: executiveDashboardService.get,
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-lg font-bold text-slate-800 dark:text-white sm:text-xl">Análises</h1>
        <p className="text-sm text-slate-400">Uma visão completa da sua produtividade, rotina e hábitos.</p>
      </div>

      {isLoading || !data ? (
        <Loading label="Calculando suas análises..." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <MonthlyEvolutionChart data={data.monthlyEvolution} />
          <QuarterSemesterCard quarterSummary={data.quarterSummary} semesterSummary={data.semesterSummary} />
          <CategoryDistributionChart data={data.categoryDistribution} />
          <TaskTrendChart data={data.taskTrend} />
          <MonthSummaryCard data={data.monthSummary} monthLabel={formatMonthYear(new Date())} />
          <PriorityBreakdownChart data={data.priorityBreakdown} />
          <WeekdayActivityChart data={data.weekdayActivity} />
          <StatusBreakdownChart data={data.statusBreakdown} />
          <HabitConsistencyChart data={data.habitConsistency} />
        </div>
      )}

      {execLoading || !execData ? (
        <Loading label="Montando seu dashboard executivo..." />
      ) : (
        <ExecutiveDashboard data={execData} />
      )}
    </div>
  );
}

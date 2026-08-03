import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Flame, Target } from "lucide-react";
import { useHabits, useHabitMutations } from "@/hooks/useExtras";
import { EmptyState, Skeleton } from "@/components/ui/Primitives";

function isDoneToday(logs: { date: string }[]) {
  const today = new Date().toISOString().slice(0, 10);
  return logs.some((l) => l.date === today);
}

export function HabitsWidget() {
  const { data: habits, isLoading } = useHabits();
  const { toggleToday } = useHabitMutations();

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-display font-semibold text-slate-700 dark:text-slate-200">
          <Target className="h-4 w-4" /> Hábitos de hoje
        </h3>
        <Link to="/habits" className="text-xs font-medium text-primary-500 hover:underline">
          Ver todos
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : !habits || habits.length === 0 ? (
        <EmptyState
          icon={<Target className="h-5 w-5" />}
          title="Nenhum hábito criado"
          description="Crie hábitos para acompanhar sua consistência diária."
        />
      ) : (
        <div className="space-y-1">
          {habits.slice(0, 5).map((habit) => {
            const done = isDoneToday(habit.logs);
            return (
              <button
                key={habit.id}
                onClick={() => toggleToday.mutate(habit.id)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.08]"
              >
                {done ? (
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" style={{ color: habit.color }} />
                ) : (
                  <Circle className="h-4.5 w-4.5 shrink-0 text-slate-300 dark:text-slate-600" />
                )}
                <span className={`flex-1 truncate text-sm ${done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}>
                  {habit.name}
                </span>
                <Flame className="h-3.5 w-3.5 text-warning-500" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

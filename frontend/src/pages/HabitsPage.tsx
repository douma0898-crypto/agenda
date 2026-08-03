import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Flame, Trash2, Target, CheckCircle2, Circle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useHabits, useHabitMutations } from "@/hooks/useExtras";
import { habitService } from "@/services/extraServices";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loading, EmptyState } from "@/components/ui/Primitives";
import { Habit } from "@/utils/types";

const COLOR_OPTIONS = ["#3454D1", "#0F9B8E", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#EC4899"];

function isDoneToday(logs: { date: string }[]) {
  const today = new Date().toISOString().slice(0, 10);
  return logs.some((l) => l.date === today);
}

function HabitHistory({ habitId }: { habitId: string }) {
  const { data: stats } = useQuery({ queryKey: ["habit-stats", habitId], queryFn: () => habitService.stats(habitId) });
  if (!stats) return null;

  return (
    <div className="mt-3 flex items-center gap-1">
      {stats.history.map((day) => (
        <span
          key={day.date}
          title={day.date}
          className={clsx("h-4 w-2.5 rounded-sm", day.done ? "bg-primary-500" : "bg-slate-100 dark:bg-white/10")}
        />
      ))}
    </div>
  );
}

export default function HabitsPage() {
  const { data: habits, isLoading } = useHabits();
  const { create, toggleToday, remove } = useHabitMutations();
  const [formOpen, setFormOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } = useForm<{ name: string; color: string; frequency: string }>({
    defaultValues: { name: "", color: COLOR_OPTIONS[0], frequency: "daily" },
  });

  const onSubmit = (values: { name: string; color: string; frequency: string }) => {
    create.mutate(
      { name: values.name, color: values.color, frequency: values.frequency as Habit["frequency"] },
      {
        onSuccess: () => {
          setFormOpen(false);
          reset();
        },
      }
    );
  };

  const selectedColor = watch("color");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-lg font-bold text-slate-800 dark:text-white sm:text-xl">Hábitos</h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Novo hábito
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : !habits || habits.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="Nenhum hábito criado"
          description="Hábitos ajudam a construir consistência dia após dia."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Novo hábito
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {habits.map((habit) => {
            const done = isDoneToday(habit.logs);
            return (
              <div key={habit.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => toggleToday.mutate(habit.id)} className="flex flex-1 items-center gap-2.5 text-left">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: habit.color }} />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
                    )}
                    <div>
                      <p className={clsx("text-sm font-medium", done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200")}>
                        {habit.name}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        <Flame className="h-3 w-3 text-warning-500" />
                        {habit.frequency === "daily" ? "Diário" : "Semanal"}
                      </p>
                    </div>
                  </button>
                  <button onClick={() => remove.mutate(habit.id)} className="btn-ghost !p-1.5 rounded-full text-danger-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <HabitHistory habitId={habit.id} />
              </div>
            );
          })}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Novo hábito">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" placeholder="Ex: Beber 2L de água" {...register("name", { required: true })} />

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">Frequência</span>
            <select className="input-field" {...register("frequency")}>
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Cor</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className="h-8 w-8 rounded-full transition-all"
                  style={{ backgroundColor: color, boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : "none" }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200/70 dark:border-white/10 pt-4">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={create.isPending}>
              Criar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

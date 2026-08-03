import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Play, Pause, RotateCcw, Coffee, Brain, SkipForward } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Mode = "focus" | "short" | "long";

const DEFAULT_MINUTES: Record<Mode, number> = {
  focus: 25,
  short: 5,
  long: 15,
};

const MODE_LABEL: Record<Mode, string> = {
  focus: "Foco",
  short: "Pausa curta",
  long: "Pausa longa",
};

const STORAGE_KEY = "agenda_focus_durations";

function loadDurationMinutes(): Record<Mode, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MINUTES;
    const parsed = JSON.parse(raw);
    return {
      focus: Number(parsed.focus) > 0 ? Number(parsed.focus) : DEFAULT_MINUTES.focus,
      short: Number(parsed.short) > 0 ? Number(parsed.short) : DEFAULT_MINUTES.short,
      long: Number(parsed.long) > 0 ? Number(parsed.long) : DEFAULT_MINUTES.long,
    };
  } catch {
    return DEFAULT_MINUTES;
  }
}

interface DurationForm {
  focus: number;
  short: number;
  long: number;
}

export default function FocusPage() {
  const [durationMinutes, setDurationMinutes] = useState<Record<Mode, number>>(loadDurationMinutes);
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes.focus * 60);
  const [running, setRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { register, handleSubmit, reset: resetForm } = useForm<DurationForm>({ defaultValues: durationMinutes });

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    if (!running) {
      setSecondsLeft(durationMinutes[mode] * 60);
    }
  }, [mode, durationMinutes, running]);

  const switchMode = useCallback(
    (next: Mode) => {
      setMode(next);
      setRunning(false);
    },
    []
  );

  const handleComplete = useCallback(() => {
    setRunning(false);
    if (mode === "focus") {
      setCyclesCompleted((currentCycles) => {
        const nextCycle = currentCycles + 1;
        toast.success("Sessão de foco concluída! Hora de uma pausa 🎉");
        switchMode(nextCycle % 4 === 0 ? "long" : "short");
        return nextCycle;
      });
    } else {
      toast.success("Pausa concluída. Vamos focar novamente!");
      switchMode("focus");
    }
  }, [mode, switchMode]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(durationMinutes[mode] * 60);
  };

  const onSaveDurations = (values: DurationForm) => {
    const sanitized: Record<Mode, number> = {
      focus: Math.min(Math.max(Number(values.focus) || DEFAULT_MINUTES.focus, 1), 180),
      short: Math.min(Math.max(Number(values.short) || DEFAULT_MINUTES.short, 1), 60),
      long: Math.min(Math.max(Number(values.long) || DEFAULT_MINUTES.long, 1), 90),
    };
    setDurationMinutes(sanitized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    resetForm(sanitized);
    toast.success("Durações personalizadas salvas");
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const progress = 1 - secondsLeft / (durationMinutes[mode] * 60);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:px-6">
      <div className="mb-5 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/95">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Modo Foco</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Foco rápido e limpo</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Um cronômetro simples com controles diretos e minutos personalizáveis.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.95fr]">
        <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/95">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Ciclo</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{MODE_LABEL[mode]}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["focus", "short", "long"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={clsx(
                    "rounded-full px-3 py-2 text-sm transition",
                    mode === m
                      ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-950"
                      : "border border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                  )}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200/70 bg-slate-50 p-5 text-center dark:border-slate-700/80 dark:bg-slate-900/90">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-950">
              {mode === "focus" ? <Brain className="h-6 w-6 text-primary-500" /> : <Coffee className="h-6 w-6 text-secondary-500" />}
            </div>
            <div className="text-[3.75rem] font-semibold text-slate-900 dark:text-white">{minutes}:{seconds}</div>
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ciclo {cyclesCompleted + 1}</div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-primary-500 transition-all duration-300" style={{ width: `${Math.min(Math.max(progress * 100, 0), 100)}%` }} />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => setRunning((r) => !r)} className="w-full sm:w-auto">
              {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {running ? "Pausar" : "Iniciar"}
            </Button>
            <Button variant="secondary" onClick={reset} className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reiniciar
            </Button>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {cyclesCompleted} sessão(ões) concluída(s). Controle claro, sem excesso.
          </p>
        </section>

        <aside className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-950/95">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Durações</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Tempo</h3>
          </div>

          <form onSubmit={handleSubmit(onSaveDurations)} className="space-y-3">
            {(["focus", "short", "long"] as const).map((m) => (
              <label key={m} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/80 dark:bg-slate-900/90">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{MODE_LABEL[m]}</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  {...register(m, { required: true, min: 1, max: m === "focus" ? 180 : m === "short" ? 60 : 90 })}
                  className="w-20 text-right"
                />
              </label>
            ))}

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button type="submit" className="w-full sm:w-auto">Salvar</Button>
              <Button type="button" variant="secondary" onClick={() => resetForm(durationMinutes)} className="w-full sm:w-auto">
                Restaurar
              </Button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}

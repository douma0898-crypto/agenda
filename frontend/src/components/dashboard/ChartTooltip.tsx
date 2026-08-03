interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadEntry[];
  formatter?: (value: number | string, name?: string) => string;
  labelFormatter?: (label: string) => string;
}

/**
 * Tooltip translúcido compartilhado por todos os gráficos do dashboard/análises.
 * Usa vidro fosco (glass) em vez da caixa branca opaca padrão do Recharts, e já
 * se adapta ao tema claro/escuro via classes Tailwind.
 */
export function ChartTooltip({ active, label, payload, formatter, labelFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[140px] rounded-xl border border-white/50 dark:border-white/[0.1] bg-white/60 dark:bg-slate-900/55 px-3 py-2.5 text-xs shadow-lg backdrop-blur-md">
      {label !== undefined && (
        <p className="mb-1.5 font-semibold text-slate-600 dark:text-slate-300">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-slate-500 dark:text-slate-400">{entry.name}</span>
            <span className="ml-auto font-semibold text-slate-700 dark:text-slate-100">
              {formatter ? formatter(entry.value ?? "", entry.name) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

import {
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, format, addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function getMonthGrid(reference: Date): Date[] {
  const start = startOfWeek(startOfMonth(reference), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(reference), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end });
}

export function getWeekDays(reference: Date): Date[] {
  const start = startOfWeek(reference, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export { addMonths, subMonths, isSameMonth, isSameDay, addDays };

export function formatDay(date: Date) {
  return format(date, "d");
}

export function formatWeekdayShort(date: Date) {
  return format(date, "EEEEEE", { locale: ptBR });
}

export function formatMonthYear(date: Date) {
  const label = format(date, "MMMM yyyy", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatTime(iso: string) {
  return format(new Date(iso), "HH:mm");
}

export function formatFullDate(iso: string) {
  const label = format(new Date(iso), "EEEE, d 'de' MMMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function toDateTimeLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const PRIORITY_LABEL: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  urgent: "Urgente",
};

export const PRIORITY_COLOR: Record<string, string> = {
  low: "#64748B",
  medium: "#3B82F6",
  high: "#F59E0B",
  urgent: "#EF4444",
};

export const REMINDER_OPTIONS = [
  { label: "10 minutos antes", value: 10 },
  { label: "30 minutos antes", value: 30 },
  { label: "1 hora antes", value: 60 },
  { label: "2 horas antes", value: 120 },
  { label: "6 horas antes", value: 360 },
  { label: "12 horas antes", value: 720 },
  { label: "1 dia antes", value: 1440 },
  { label: "2 dias antes", value: 2880 },
  { label: "1 semana antes", value: 10080 },
];

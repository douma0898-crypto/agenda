export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  theme: "dark" | "light";
  primaryColor: string;
  language: string;
  timeFormat: "24h" | "12h";
  dateFormat: string;
  timezone: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ReminderItem {
  id?: string;
  minutesBefore: number;
  label?: string;
}

export type Priority = "low" | "medium" | "high" | "urgent";
export type EventStatus = "scheduled" | "in_progress" | "done" | "canceled";
export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
}

export interface CalendarEvent {
  id: string;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  color: string;
  icon?: string | null;
  location?: string | null;
  link?: string | null;
  participants?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  recurrence: Recurrence;
  recurrenceEnd?: string | null;
  priority: Priority;
  status: EventStatus;
  notes?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  isFavorite: boolean;
  tags: Tag[];
  reminders: ReminderItem[];
  attachments: AttachmentItem[];
  isRecurrenceInstance?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus = "pending" | "in_progress" | "done";

export interface ChecklistItem {
  id?: string;
  title: string;
  done: boolean;
  position: number;
}

export interface TaskItem {
  id: string;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes?: number | null;
  isFavorite: boolean;
  completedAt?: string | null;
  checklist: ChecklistItem[];
  tags: Tag[];
  createdAt?: string;
}

export interface DashboardSummary {
  todayEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  overdueEvents: CalendarEvent[];
  pendingTasksCount: number;
  doneTasksCount: number;
  overdueTasksCount: number;
  productiveMinutesToday: number;
  totals: { events: number; tasks: number };
}

export interface MonthlyEvolutionPoint {
  month: string;
  label: string;
  productiveHours: number;
  eventsCount: number;
  tasksCompletedCount: number;
  avgFocus: number;
}

export interface CategoryDistributionEntry {
  categoryId: string;
  name: string;
  color: string;
  hours: number;
  percentage: number;
}

export interface TaskTrendPoint {
  weekLabel: string;
  weekStart: string;
  created: number;
  completed: number;
}

export interface MonthSummary {
  totalEvents: number;
  pendingEvents: number;
  completionRate: number;
  dailyAverageHours: number;
  totalHours6m: number;
}

export interface QuarterSummaryEntry {
  quarterLabel: string;
  productiveHours: number;
  eventsCount: number;
  tasksCompletedCount: number;
  avgFocus: number;
}

export interface SemesterSummaryEntry {
  semesterLabel: string;
  productiveHours: number;
  eventsCount: number;
  tasksCompletedCount: number;
  avgFocus: number;
}

export interface PriorityBreakdownEntry {
  priority: string;
  label: string;
  count: number;
}

export interface WeekdayActivityEntry {
  weekday: string;
  count: number;
}

export interface StatusBreakdownEntry {
  status: string;
  label: string;
  count: number;
}

export interface HabitConsistencyEntry {
  habitId: string;
  name: string;
  color: string;
  percentage: number;
}

export interface DashboardAnalytics {
  monthlyEvolution: MonthlyEvolutionPoint[];
  quarterSummary: QuarterSummaryEntry[];
  semesterSummary: SemesterSummaryEntry[];
  categoryDistribution: CategoryDistributionEntry[];
  taskTrend: TaskTrendPoint[];
  monthSummary: MonthSummary;
  priorityBreakdown: PriorityBreakdownEntry[];
  weekdayActivity: WeekdayActivityEntry[];
  statusBreakdown: StatusBreakdownEntry[];
  habitConsistency: HabitConsistencyEntry[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface AppNotification {
  id: string;
  title: string;
  message?: string | null;
  type: "reminder" | "system" | "task" | "event";
  read: boolean;
  referenceId?: string | null;
  createdAt: string;
}

export interface HabitLogEntry {
  id: string;
  date: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  frequency: "daily" | "weekly";
  targetPerPeriod: number;
  archived: boolean;
  logs: HabitLogEntry[];
}

export interface HabitStats {
  streak: number;
  totalCompletions: number;
  history: { date: string; done: boolean }[];
}

export interface Note {
  id: string;
  title?: string | null;
  content?: string | null;
  color: string;
  pinned: boolean;
  updatedAt: string;
}

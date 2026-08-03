import api from "@/services/api";

export interface HeatmapCell {
  weekday: number;
  weekdayLabel: string;
  hour: number;
  minutes: number;
  intensity: number;
}

export interface ExecutiveDashboardData {
  heatmap: HeatmapCell[];
  mostProductiveHours: { hour: number; label: string; minutes: number }[];
  busiestDays: { date: string; minutes: number; eventsCount: number }[];
  timeLostVsFocused: { focusedMinutes: number; focusedHours: number; lostMinutes: number; lostHours: number };
  categoryRanking: { rank: number; categoryId: string; name: string; color: string; hours: number }[];
  streak: { currentStreak: number; bestStreak: number };
  achievements: { id: string; title: string; description: string; unlocked: boolean }[];
}

export const executiveDashboardService = {
  async get() {
    const { data } = await api.get("/analytics/executive");
    return data.data as ExecutiveDashboardData;
  },
};

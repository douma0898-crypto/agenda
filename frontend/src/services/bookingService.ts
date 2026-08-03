import api, { API_BASE_URL } from "@/services/api";

export interface BookingSettings {
  publicSlug: string;
  enabled: boolean;
  slotMinutes: number;
  workStart: string;
  workEnd: string;
  workDays: number[];
  daysAhead: number;
  noticeMinutes: number;
  title: string;
  description: string | null;
}

export interface DayAvailability {
  date: string;
  slots: { start: string; end: string }[];
}

export interface PublicBookingInfo {
  owner: { name: string; avatarUrl: string | null };
  title: string;
  description: string | null;
  slotMinutes: number;
  availability: DayAvailability[];
}

// URL base "crua" da API, sem o /api no final, pra montar o link público compartilhável
const APP_ORIGIN = typeof window !== "undefined" ? window.location.origin : "";

export interface Appointment {
  id: string;
  title: string;
  description: string | null;
  contactEmail: string | null;
  participants: string | null;
  startAt: string;
  endAt: string;
  status: string;
}

export const bookingService = {
  // --- Configurações (autenticado, dono do app) ---
  getSettings: async () => {
    const { data } = await api.get("/booking/settings");
    return data.data as BookingSettings;
  },
  updateSettings: async (payload: Partial<BookingSettings>) => {
    const { data } = await api.put("/booking/settings", payload);
    return data.data as BookingSettings;
  },
  regenerateLink: async () => {
    const { data } = await api.post("/booking/settings/regenerate-link");
    return data.data as BookingSettings;
  },
  buildPublicUrl: (slug: string) => `${APP_ORIGIN}/agendar/${slug}`,

  listAppointments: async (scope: "upcoming" | "past" | "all" = "upcoming") => {
    const { data } = await api.get("/booking/appointments", { params: { scope } });
    return data.data as Appointment[];
  },
  cancelAppointment: async (id: string) => {
    await api.delete(`/booking/appointments/${id}`);
  },

  // --- Área pública (sem autenticação) ---
  getPublicInfo: async (slug: string) => {
    const { data } = await api.get(`/public/booking/${slug}`);
    return data.data as PublicBookingInfo;
  },
  createBooking: async (
    slug: string,
    payload: { name: string; email: string; start: string; notes?: string }
  ) => {
    const { data } = await api.post(`/public/booking/${slug}`, payload);
    return data.data as { eventId: string };
  },
};

export { API_BASE_URL };

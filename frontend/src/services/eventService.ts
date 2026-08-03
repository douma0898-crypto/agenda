import api from "./api";
import { ApiResponse, CalendarEvent } from "@/utils/types";

export interface EventFilters {
  start?: string;
  end?: string;
  categoryId?: string;
  status?: string;
  favorite?: boolean;
  search?: string;
}

export const eventService = {
  async list(filters: EventFilters = {}) {
    const { data } = await api.get<ApiResponse<CalendarEvent[]>>("/events", { params: filters });
    return data.data;
  },

  async get(id: string) {
    const { data } = await api.get<ApiResponse<CalendarEvent>>(`/events/${id}`);
    return data.data;
  },

  async create(payload: Partial<CalendarEvent>) {
    const { data } = await api.post<ApiResponse<CalendarEvent>>("/events", payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CalendarEvent>) {
    const { data } = await api.put<ApiResponse<CalendarEvent>>(`/events/${id}`, payload);
    return data.data;
  },

  async move(id: string, startAt: string, endAt: string) {
    const { data } = await api.patch<ApiResponse<CalendarEvent>>(`/events/${id}/move`, { startAt, endAt });
    return data.data;
  },

  async duplicate(id: string) {
    const { data } = await api.post<ApiResponse<CalendarEvent>>(`/events/${id}/duplicate`);
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/events/${id}`);
  },
};

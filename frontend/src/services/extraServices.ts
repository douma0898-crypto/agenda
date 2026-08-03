import api from "./api";
import { ApiResponse, AppNotification, Habit, HabitStats, Note } from "@/utils/types";

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  sms: boolean;
  whatsapp: boolean;
  sound: string;
  vibration: boolean;
  phoneNumber: string | null;
}

export interface ChannelsStatus {
  email: boolean;
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
  vapidPublicKey: string | null;
}

export const notificationService = {
  async list(unreadOnly = false) {
    const { data } = await api.get<ApiResponse<AppNotification[]>>("/notifications", {
      params: unreadOnly ? { unread: "true" } : {},
    });
    return { items: data.data, unreadCount: (data.meta?.unreadCount as number) || 0 };
  },
  async markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
  },
  async markAllRead() {
    await api.patch("/notifications/read-all");
  },
  async remove(id: string) {
    await api.delete(`/notifications/${id}`);
  },
  async getSettings() {
    const { data } = await api.get<ApiResponse<NotificationSettings>>("/notifications/settings");
    return data.data;
  },
  async updateSettings(payload: Partial<NotificationSettings>) {
    const { data } = await api.put<ApiResponse<NotificationSettings>>("/notifications/settings", payload);
    return data.data;
  },
  async channelsStatus() {
    const { data } = await api.get<ApiResponse<ChannelsStatus>>("/notifications/channels/status");
    return data.data;
  },
  async pushSubscribe(subscription: PushSubscriptionJSON) {
    await api.post("/notifications/push/subscribe", subscription);
  },
  async pushUnsubscribe(endpoint: string) {
    await api.post("/notifications/push/unsubscribe", { endpoint });
  },
  async sendTest() {
    const { data } = await api.post<ApiResponse<Record<string, { attempted: boolean; success?: boolean; detail?: string }>>>("/notifications/test");
    return data.data;
  },
};

export const habitService = {
  async list() {
    const { data } = await api.get<ApiResponse<Habit[]>>("/habits");
    return data.data;
  },
  async create(payload: Partial<Habit>) {
    const { data } = await api.post<ApiResponse<Habit>>("/habits", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<Habit>) {
    const { data } = await api.put<ApiResponse<Habit>>(`/habits/${id}`, payload);
    return data.data;
  },
  async toggleToday(id: string, date?: string) {
    const { data } = await api.post<ApiResponse<{ date: string; done: boolean }>>(`/habits/${id}/toggle`, { date });
    return data.data;
  },
  async stats(id: string) {
    const { data } = await api.get<ApiResponse<HabitStats>>(`/habits/${id}/stats`);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/habits/${id}`);
  },
};

export const noteService = {
  async list() {
    const { data } = await api.get<ApiResponse<Note[]>>("/notes");
    return data.data;
  },
  async create(payload: Partial<Note>) {
    const { data } = await api.post<ApiResponse<Note>>("/notes", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<Note>) {
    const { data } = await api.put<ApiResponse<Note>>(`/notes/${id}`, payload);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/notes/${id}`);
  },
};

async function downloadFile(url: string, filename: string) {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const exportService = {
  eventsCsv: () => downloadFile("/export/events.csv", "eventos.csv"),
  eventsXlsx: () => downloadFile("/export/events.xlsx", "eventos.xlsx"),
  eventsPdf: () => downloadFile("/export/events.pdf", "eventos.pdf"),
  tasksCsv: () => downloadFile("/export/tasks.csv", "tarefas.csv"),
  tasksXlsx: () => downloadFile("/export/tasks.xlsx", "tarefas.xlsx"),
  tasksPdf: () => downloadFile("/export/tasks.pdf", "tarefas.pdf"),
  backup: () => downloadFile("/backup/export", "agenda-backup.json"),
  executiveReportPdf: () => downloadFile("/analytics/report.pdf", "relatorio-executivo.pdf"),
};

export const importService = {
  async eventsCsv(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<ApiResponse<{ created: number; skipped: number }>>("/import/events.csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  async restoreBackup(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/backup/restore", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};

export const attachmentService = {
  async upload(file: File, opts: { eventId?: string; taskId?: string }) {
    const formData = new FormData();
    formData.append("file", file);
    if (opts.eventId) formData.append("eventId", opts.eventId);
    if (opts.taskId) formData.append("taskId", opts.taskId);
    const { data } = await api.post("/attachments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/attachments/${id}`);
  },
};

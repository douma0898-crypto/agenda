import api from "./api";
import { ApiResponse, TaskItem } from "@/utils/types";

export interface TaskFilters {
  status?: string;
  categoryId?: string;
  priority?: string;
  search?: string;
}

export const taskService = {
  async list(filters: TaskFilters = {}) {
    const { data } = await api.get<ApiResponse<TaskItem[]>>("/tasks", { params: filters });
    return data.data;
  },

  async create(payload: Partial<TaskItem>) {
    const { data } = await api.post<ApiResponse<TaskItem>>("/tasks", payload);
    return data.data;
  },

  async update(id: string, payload: Partial<TaskItem>) {
    const { data } = await api.put<ApiResponse<TaskItem>>(`/tasks/${id}`, payload);
    return data.data;
  },

  async toggleComplete(id: string) {
    const { data } = await api.patch<ApiResponse<TaskItem>>(`/tasks/${id}/complete`);
    return data.data;
  },

  async duplicate(id: string) {
    const { data } = await api.post<ApiResponse<TaskItem>>(`/tasks/${id}/duplicate`);
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/tasks/${id}`);
  },
};

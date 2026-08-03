import api from "./api";
import { ApiResponse, Category, DashboardSummary, DashboardAnalytics } from "@/utils/types";

export const categoryService = {
  async list() {
    const { data } = await api.get<ApiResponse<Category[]>>("/categories");
    return data.data;
  },
  async create(payload: Partial<Category>) {
    const { data } = await api.post<ApiResponse<Category>>("/categories", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<Category>) {
    const { data } = await api.put<ApiResponse<Category>>(`/categories/${id}`, payload);
    return data.data;
  },
  async remove(id: string) {
    await api.delete(`/categories/${id}`);
  },
};

export const dashboardService = {
  async summary() {
    const { data } = await api.get<ApiResponse<DashboardSummary>>("/dashboard/summary");
    return data.data;
  },
  async analytics() {
    const { data } = await api.get<ApiResponse<DashboardAnalytics>>("/dashboard/analytics");
    return data.data;
  },
};

import api from "./api";
import { ApiResponse, User } from "@/utils/types";

interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post<ApiResponse<AuthPayload>>("/auth/login", { email, password });
    return data.data;
  },

  async register(name: string, email: string, password: string) {
    const { data } = await api.post<ApiResponse<AuthPayload>>("/auth/register", { name, email, password });
    return data.data;
  },

  async me() {
    const { data } = await api.get<ApiResponse<User>>("/auth/me");
    return data.data;
  },

  async updateProfile(payload: Partial<User>) {
    const { data } = await api.put<ApiResponse<User>>("/auth/me", payload);
    return data.data;
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await api.post<ApiResponse<{ avatarUrl: string }>>("/auth/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  },

  async forgotPassword(email: string) {
    await api.post("/auth/forgot-password", { email });
  },
};

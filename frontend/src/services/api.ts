import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const defaultHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const configuredApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "").trim();

const normalizeApiBaseUrl = (value: string) => {
  const trimmed = value.replace(/\/$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const defaultApiUrl = import.meta.env.PROD
  ? `${window.location.origin.replace(/\/$/, "")}/api`
  : `http://${defaultHost}:5000/api`;

export const API_BASE_URL = normalizeApiBaseUrl(configuredApiUrl || defaultApiUrl);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const authEndpoints = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/forgot-password"];
    const shouldSkipRefresh = originalRequest?.url
      ? authEndpoints.some((endpoint) => originalRequest.url?.includes(endpoint))
      : false;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !shouldSkipRefresh) {
      if (isRefreshing) {
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        return api(originalRequest);
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");

      try {
        if (!refreshToken) throw new Error("Sem refresh token");
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        localStorage.setItem("accessToken", data.data.accessToken);
        pendingQueue.forEach((resolve) => resolve());
        pendingQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("agenda_user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

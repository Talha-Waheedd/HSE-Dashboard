import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";
import { tokenStore } from "./tokenStore";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

let refreshHandler: (() => Promise<string | null>) | null = null;
let refreshing: Promise<string | null> | null = null;

export const configureTokenRefresh = (handler: () => Promise<string | null>) => {
  refreshHandler = handler;
};

// Request Interceptor: Inject JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env?.VITE_BYPASS_AUTH === "true") {
      config.headers["X-Preview-Auth"] = "true";
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);
// Response Interceptor: Handle Global Errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean } | undefined;
    if (error.response?.status === 401 && original && !original._retry && refreshHandler) {
      original._retry = true;
      refreshing ??= refreshHandler().finally(() => { refreshing = null; });
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient.request(original);
      }
    }
    return Promise.reject(error);
  }
);

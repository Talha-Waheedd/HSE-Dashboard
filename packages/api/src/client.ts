import axios, { type InternalAxiosRequestConfig, type AxiosError } from "axios";
import { tokenStore } from "./tokenStore";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:5000/api/v1";
const PREVIEW_BYPASS = import.meta.env.DEV && import.meta.env?.VITE_BYPASS_AUTH === "true";

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
    if (PREVIEW_BYPASS) {
      config.headers["X-Preview-Auth"] = "true";
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Response Interceptor: Handle Global Errors (e.g., 401 Unauthorized, 5xx with backoff)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number } | undefined;
    
    // 1. Handle 401 Unauthorized (Token Refresh)
    if (error.response?.status === 401 && original && !original._retry && refreshHandler) {
      original._retry = true;
      refreshing ??= refreshHandler().finally(() => { refreshing = null; });
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient.request(original);
      }
    }

    // 2. Handle transient, idempotent failures with exponential backoff.
    // Deterministic application errors (including HTTP 500 responses caused by
    // invalid queries) must not be retried three times, and mutating requests
    // must never be duplicated by this interceptor.
    const method = original?.method?.toUpperCase();
    const retryableMethod = !method || ["GET", "HEAD", "OPTIONS"].includes(method);
    const status = error.response?.status;
    const shouldRetry = Boolean(original && retryableMethod && (
      !error.response ||
      status === 429 ||
      status === 502 ||
      status === 503 ||
      status === 504
    ));

    if (original && shouldRetry) {
      original._retryCount = original._retryCount || 0;
      if (original._retryCount < MAX_RETRIES) {
        original._retryCount += 1;
        // Exponential backoff: 1s, 2s, 4s
        const delay = RETRY_DELAY_MS * (2 ** (original._retryCount - 1));
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiClient.request(original);
      }
    }

    return Promise.reject(error);
  }
);

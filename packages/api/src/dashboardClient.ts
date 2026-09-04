import { apiClient } from "./client";

export interface DashboardIndicatorPreferences {
  leadingIndicatorIds: string[];
  laggingIndicatorIds: string[];
  customized: boolean;
}

export const dashboardClient = {
  getStats: (params?: Record<string, unknown>) => apiClient.get("/dashboard/stats", { params }),
  getOverview: (params?: Record<string, unknown>) => apiClient.get("/dashboard/overview", { params }),
  getIndicatorPreferences: () => apiClient.get<{ data: DashboardIndicatorPreferences }>("/dashboard/preferences"),
  updateIndicatorPreferences: (preferences: Pick<DashboardIndicatorPreferences, "leadingIndicatorIds" | "laggingIndicatorIds">) =>
    apiClient.put<{ data: DashboardIndicatorPreferences }>("/dashboard/preferences", preferences),
  getAnalyticsOverview: (params?: Record<string, unknown>) => apiClient.get("/analytics/overview", { params }),
  getPerformance: (params?: Record<string, unknown>) => apiClient.get("/reports/performance", { params }),
  getRiskMatrix: (params?: Record<string, unknown>) => apiClient.get("/reports/risk-matrix", { params }),
};

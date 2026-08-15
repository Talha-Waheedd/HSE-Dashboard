import { apiClient } from "./client";

export const dashboardClient = {
  getStats: (params?: Record<string, unknown>) => apiClient.get("/dashboard/stats", { params }),
  getOverview: (params?: Record<string, unknown>) => apiClient.get("/dashboard/overview", { params }),
  getAnalyticsOverview: (params?: Record<string, unknown>) => apiClient.get("/analytics/overview", { params }),
  getPerformance: (params?: Record<string, unknown>) => apiClient.get("/reports/performance", { params }),
  getRiskMatrix: (params?: Record<string, unknown>) => apiClient.get("/reports/risk-matrix", { params }),
};

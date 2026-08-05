import { apiClient } from "./client";

export const dashboardClient = {
  getStats: (params?: Record<string, unknown>) => apiClient.get("/dashboard/stats", { params }),
  getPerformance: (params?: Record<string, unknown>) => apiClient.get("/reports/performance", { params }),
  getRiskMatrix: (params?: Record<string, unknown>) => apiClient.get("/reports/risk-matrix", { params }),
};

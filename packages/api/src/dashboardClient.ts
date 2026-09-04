import { apiClient } from "./client";

export interface DashboardIndicatorPreferences {
  leadingIndicatorIds: string[];
  laggingIndicatorIds: string[];
  customized: boolean;
}

export type DashboardAnalyticsDataset = 'incidents' | 'hazards' | 'near-misses' | 'training' | 'capa' | 'audits' | 'fire';

export interface DashboardAnalyticsPoint {
  key: string;
  label: string;
  value: number;
}

export interface DashboardAnalyticsResult {
  dataset: DashboardAnalyticsDataset;
  groupBy: string;
  metric: string;
  chartType: 'bar' | 'donut' | 'line';
  unit: string;
  total: number;
  data: DashboardAnalyticsPoint[];
}

export const dashboardClient = {
  getStats: (params?: Record<string, unknown>) => apiClient.get("/dashboard/stats", { params }),
  getOverview: (params?: Record<string, unknown>) => apiClient.get("/dashboard/overview", { params }),
  getAnalyticsCatalog: () => apiClient.get("/dashboard/analytics"),
  getAnalytics: (dataset: DashboardAnalyticsDataset, params?: Record<string, unknown>) =>
    apiClient.get<{ data: DashboardAnalyticsResult }>(`/dashboard/analytics/${dataset}`, { params }),
  getIndicatorPreferences: () => apiClient.get<{ data: DashboardIndicatorPreferences }>("/dashboard/preferences"),
  updateIndicatorPreferences: (preferences: Pick<DashboardIndicatorPreferences, "leadingIndicatorIds" | "laggingIndicatorIds">) =>
    apiClient.put<{ data: DashboardIndicatorPreferences }>("/dashboard/preferences", preferences),
  getAnalyticsOverview: (params?: Record<string, unknown>) => apiClient.get("/analytics/overview", { params }),
  getPerformance: (params?: Record<string, unknown>) => apiClient.get("/reports/performance", { params }),
  getRiskMatrix: (params?: Record<string, unknown>) => apiClient.get("/reports/risk-matrix", { params }),
};

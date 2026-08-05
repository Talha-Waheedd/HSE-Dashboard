import { apiClient } from "./client";

export type ReportExportType = "PDF" | "Excel" | "CSV" | "Word";

export const reportClient = {
  list: (params?: Record<string, unknown>) => apiClient.get("/reports/saved", { params }),
  create: (payload: Record<string, unknown>) => apiClient.post("/reports/saved", payload),
  export: (payload: { reportId?: string; exportType: ReportExportType; filters?: Record<string, unknown> }) =>
    apiClient.post("/reports/exports", payload),
  exportPerformance: (payload: { exportType: ReportExportType; filters?: Record<string, unknown> }) =>
    apiClient.post("/reports/exports", { reportType: "performance", ...payload }),
};

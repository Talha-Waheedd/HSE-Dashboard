export type ReportType = 'Hazard Reporting' | 'Near Miss' | 'Incident Log';
export type AnalysisStatus = 'Not Reviewed' | 'Under Review' | 'Analysis Completed';
export type MasterAnalysisStatus = 'not_reviewed' | 'under_review' | 'completed';
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface MasterAnalysisData {
  incidentClassification?: { type?: string; locationCondition?: string };
  injuryAnalysis?: { injuryType?: string; bodyPartGroup?: string; bodyPartSpecific?: string };
  rootCauseAnalysis?: { primaryCause?: string; contributingFactors?: string };
  severityClassification?: SeverityLevel;
  remarks?: string;
}

export interface UnifiedReport {
  id: string;
  originalReportId: string;
  sourceType: string;
  sourceId: string;
  reportType: ReportType;
  reportedBy: string;
  department: string;
  location: string;
  date: string;
  description: string;
  originalStatus: string;
  analysisStatus: AnalysisStatus;
  analysisData: MasterAnalysisData;
  originalData: Record<string, unknown>;
}

export interface MasterAnalysisSummary {
  totalReports: number;
  notReviewed: number;
  underReview: number;
  completed: number;
}

export interface MasterAnalysisListResponse {
  records: UnifiedReport[];
  meta: { currentPage: number; pageSize: number; totalRecords: number; totalPages: number };
  summary: MasterAnalysisSummary;
}

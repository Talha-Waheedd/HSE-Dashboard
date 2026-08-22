export type ReportType = 'Hazard Reporting' | 'Near Miss' | 'Incident Log' | 'Action Tracker' | 'Audit Management' | 'Inspection Records' | 'Critical Audit Plan';
export type AnalysisStatus = 'Not Reviewed' | 'Under Review' | 'Analysis Completed';
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface MasterAnalysisData {
  incidentClassification?: {
    type?: string;
    locationCondition?: string;
  };
  injuryAnalysis?: {
    injuryType?: string;
    bodyPartGroup?: string;
    bodyPartSpecific?: string;
  };
  rootCauseAnalysis?: {
    primaryCause?: string;
    contributingFactors?: string;
  };
  severityClassification?: SeverityLevel;
  remarks?: string;
}

export interface UnifiedReport {
  id: string; // The unified report ID (e.g. MA-2026-001)
  originalReportId: string; // The original ID from the specific module (e.g. HAZ-001)
  reportType: ReportType;
  reportedBy: string;
  department: string;
  location: string;
  date: string;
  description: string;
  originalStatus: string; // Status from the original form (Open, Closed, etc.)
  analysisStatus: AnalysisStatus;
  analysisData: MasterAnalysisData;
  originalData: Record<string, any>; // The raw data from the original form
}

export const MOCK_UNIFIED_REPORTS: UnifiedReport[] = [
  {
    id: 'MA-2026-001',
    originalReportId: 'HAZ-2608-001',
    reportType: 'Hazard Reporting',
    reportedBy: 'John Doe',
    department: 'Production',
    location: 'Line 2 Packaging Area',
    date: '2026-08-20',
    description: 'Oil spill near the packaging machine. Floor is very slippery.',
    originalStatus: 'Open',
    analysisStatus: 'Not Reviewed',
    analysisData: {},
    originalData: {
      s_no: '1',
      emp_id: 'EMP-102',
      date: '2026-08-20',
      department_id: 'Production',
      location: 'Line 2 Packaging Area',
      originator: 'John Doe',
      hazard_category_id: 'Physical Hazard',
      description: 'Oil spill near the packaging machine. Floor is very slippery.',
      unsafe_type: 'Unsafe Condition',
      person_category: 'Employee',
      responsible_person: 'Maintenance Lead',
      risk_rating_id: 'Medium',
      status_id: 'Open'
    }
  },
  {
    id: 'MA-2026-002',
    originalReportId: 'NM-2608-014',
    reportType: 'Near Miss',
    reportedBy: 'Jane Smith',
    department: 'Warehouse',
    location: 'Aisle 4',
    date: '2026-08-18',
    description: 'Forklift almost hit a pedestrian while turning the blind corner at Aisle 4.',
    originalStatus: 'Closed',
    analysisStatus: 'Analysis Completed',
    analysisData: {
      incidentClassification: {
        type: 'Collision',
        locationCondition: 'Workplace Equipment'
      },
      severityClassification: 'High',
      rootCauseAnalysis: {
        primaryCause: 'Lack of visibility at blind corners.',
        contributingFactors: 'Forklift operator driving slightly above speed limit.'
      },
      remarks: 'Mirrors have been installed. Need to conduct refresher training on speed limits.'
    },
    originalData: {
      s_no: '2',
      emp_id: 'EMP-304',
      date: '2026-08-18',
      department_id: 'Warehouse',
      reported_by: 'Jane Smith',
      designation: 'Warehouse Supervisor',
      time: '14:30',
      location: 'Aisle 4',
      details: 'Forklift almost hit a pedestrian while turning the blind corner at Aisle 4.',
      preventive_action: 'Install convex mirrors at all blind corners.',
      investigation_required: 'Yes',
      status: 'Closed'
    }
  },
  {
    id: 'MA-2026-003',
    originalReportId: 'INC-2608-005',
    reportType: 'Incident Log',
    reportedBy: 'Ali Khan',
    department: 'Maintenance',
    location: 'Boiler Room',
    date: '2026-08-15',
    description: 'Employee slipped on wet stairs and sprained his ankle.',
    originalStatus: 'Open',
    analysisStatus: 'Under Review',
    analysisData: {
      incidentClassification: {
        type: 'Slip, Trip, Fall',
        locationCondition: 'Stairs'
      },
      injuryAnalysis: {
        injuryType: 'Sprain',
        bodyPartGroup: 'Leg',
        bodyPartSpecific: 'Ankle'
      }
    },
    originalData: {
      s_no: '3',
      emp_id: 'EMP-115',
      date: '2026-08-15',
      description: 'Employee slipped on wet stairs and sprained his ankle.',
      shift: 'General',
      area_manager: 'Ahmed',
      gender: 'Male',
      location: 'Boiler Room',
      department_id: 'Maintenance',
      incident_category_id: 'LTI',
      root_cause_id: 'Slippery Surface',
      status_id: 'Open'
    }
  },
  {
    id: 'MA-2026-004',
    originalReportId: 'HAZ-2608-012',
    reportType: 'Hazard Reporting',
    reportedBy: 'Sara Lee',
    department: 'Quality',
    location: 'Lab 2',
    date: '2026-08-21',
    description: 'Exposed electrical wiring near the sink area.',
    originalStatus: 'Open',
    analysisStatus: 'Not Reviewed',
    analysisData: {},
    originalData: {
      s_no: '4',
      emp_id: 'EMP-209',
      date: '2026-08-21',
      department_id: 'Quality',
      location: 'Lab 2',
      originator: 'Sara Lee',
      hazard_category_id: 'Electrical Hazard',
      description: 'Exposed electrical wiring near the sink area.',
      unsafe_type: 'Unsafe Condition',
      person_category: 'Employee',
      responsible_person: 'Electrical Eng',
      risk_rating_id: 'High',
      status_id: 'Open'
    }
  }
];

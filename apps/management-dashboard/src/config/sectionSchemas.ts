import {
  DEPARTMENTS,
  INCIDENT_CATEGORIES,
  HAZARD_CATEGORIES,
  ROOT_CAUSES,
  RISK_RATINGS,
  STATUSES,
  CONTRACTORS
} from './constants';

export interface ColumnSchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'time' | 'select' | 'location-select' | 'textarea' | 'file' | 'actions';
  options?: string[];
  required?: boolean;
  readonly?: boolean;
  hideFromForm?: boolean;
  section?: string;
  placeholder?: string;
  compute?: (formData: any, allEntries?: any[]) => string | number;
}

export interface SectionConfig {
  id: string;
  title: string;
  path: string;
  accentColor: string;
  icon: string;
  columns: ColumnSchema[];
}

// Development-only escape hatch while the employee master data is being
// onboarded. Production builds omit this flag and retain the required field.
const allowUnverifiedHazardEmployee = import.meta.env.VITE_ALLOW_UNVERIFIED_HAZARD_EMPLOYEE === 'true';

export const hazardReportingSchema: SectionConfig = {
  id: 'hazard-reporting',
  title: 'Hazard Reporting',
  path: '/hazard-reporting',
  accentColor: '#8C1D2B',
  icon: 'AlertTriangle',
  columns: [
    { key: 's_no', label: 'S#', type: 'text', hideFromForm: true, compute: d => d.s_no || '' },
    { key: 'emp_id', label: 'Emp ID', type: 'text', required: !allowUnverifiedHazardEmployee, section: 'Basic Information' },
    { key: 'date', label: 'Date', type: 'date', required: true, section: 'Basic Information' },
    {
      key: 'month',
      label: 'Month',
      type: 'text',
      readonly: true,
      section: 'Basic Information',
      compute: (data: any) => {
        if (!data.date) return '';
        const d = new Date(data.date);
        return d.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
    },
    { key: 'department_id', label: 'Department', type: 'select', options: DEPARTMENTS, required: true, section: 'Basic Information' },
    { key: 'location', label: 'Location', type: 'location-select', required: true, section: 'Hazard Details' },
    { key: 'originator', label: 'Reported By', type: 'text', required: true, section: 'Basic Information' },
    { key: 'hazard_category_id', label: 'Hazard Category', type: 'select', options: HAZARD_CATEGORIES, required: true, section: 'Hazard Details' },
    { key: 'description', label: 'Hazard Details', type: 'textarea', required: true, section: 'Hazard Details' },
    { key: 'unsafe_type', label: 'Type of Hazard', type: 'select', options: ['Unsafe Act', 'Unsafe Condition', 'Near Miss', 'Others'], section: 'Hazard Details' },
    { key: 'person_name', label: 'Person Name', type: 'text', section: 'Hazard Details' },
    { key: 'person_category', label: 'Person Type', type: 'select', options: ['Employee', 'Contractor', 'Visitor', 'Other'], section: 'Hazard Details' },
    { key: 'corrective_action', label: 'Corrective Action', type: 'textarea', section: 'Corrective Actions' },
    { key: 'responsible_person', label: 'Responsible Person', type: 'text', required: true, section: 'Assignment' },
    { key: 'target_date', label: 'Target Date', type: 'date', section: 'Assignment' },
    { key: 'risk_rating_id', label: 'Risk Rating', type: 'select', options: RISK_RATINGS, required: true, section: 'Assignment' },
    { key: 'contractor_name', label: 'Contractor Name', type: 'text', section: 'Assignment' },
    { key: 'contractor_company', label: 'Contractor Company', type: 'select', options: CONTRACTORS, section: 'Assignment' },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true, section: 'Assignment' },
    { key: 'initial_photo', label: 'Initial Photo', type: 'file', section: 'Attachments' },
    { key: 'closing_proof_photo', label: 'Closing Proof Photo', type: 'file', section: 'Attachments' },
    { key: 'remarks', label: 'Remarks', type: 'textarea', section: 'Corrective Actions' }
  ]
};

export const nearMissSchema: SectionConfig = {
  id: 'near-miss',
  title: 'Near Miss',
  path: '/near-miss',
  accentColor: '#D9A441',
  icon: 'Target',
  columns: [
    { key: 's_no', label: 'S#', type: 'text', hideFromForm: true, compute: d => d.s_no || '' },
    { key: 'emp_id', label: 'Emp ID', type: 'text', required: true, section: 'Basic Information' },
    { key: 'date', label: 'Date', type: 'date', required: true, section: 'Basic Information' },
    {
      key: 'month',
      label: 'Month',
      type: 'text',
      readonly: true,
      section: 'Basic Information',
      compute: (data: any) => {
        if (!data.date) return '';
        const d = new Date(data.date);
        return d.toLocaleString('default', { month: 'short', year: 'numeric' });
      }
    },
    { key: 'department_id', label: 'Department', type: 'select', options: DEPARTMENTS, required: true, section: 'Basic Information' },
    { key: 'reported_by', label: 'Reported By', type: 'text', required: true, section: 'Basic Information' },
    { key: 'designation', label: 'Designation', type: 'text', required: true, section: 'Basic Information' },
    { key: 'affected_person', label: 'Affected Person Name', type: 'text', section: 'Basic Information' },
    { key: 'affected_designation', label: 'Affected Person Designation', type: 'text', section: 'Basic Information' },
    { key: 'time', label: 'Time (24 Hrs)', type: 'time', required: true, section: 'Basic Information' },
    { key: 'location', label: 'Area / Location', type: 'location-select', required: true, section: 'Basic Information' },
    { key: 'details', label: 'Details of the Near Miss', type: 'textarea', required: true, section: 'Near Miss Details' },
    { key: 'preventive_action', label: 'Preventive Action Suggestion', type: 'textarea', section: 'Corrective Actions' },
    { key: 'responsible_person', label: 'Resp.', type: 'text', section: 'Corrective Actions' },
    { key: 'investigation_required', label: 'Further Investigation Required (Y/N)', type: 'select', options: ['Yes', 'No'], section: 'Investigation' },
    { key: 'reported_in_hazard', label: 'Reported in HAZARD (Y/N)', type: 'select', options: ['Yes', 'No'], section: 'Investigation' },
    { key: 'status', label: 'Status (Open/Close)', type: 'select', options: ['Open', 'Closed'], section: 'Investigation' },
    { key: 'remarks', label: 'Remarks', type: 'textarea', section: 'Investigation' },
  ]
};

export const incidentLogSchema: SectionConfig = {
  id: 'incident-log',
  title: 'Incident Log',
  path: '/incident-log',
  accentColor: '#C46A2F',
  icon: 'FileWarning',
  columns: [
    { key: 's_no', label: 'S.No', type: 'text', hideFromForm: true, compute: d => d.s_no || '' },
    { key: 'emp_id', label: 'Emp ID', type: 'text', required: true, section: 'Basic Information' },
    { key: 'date', label: 'Date', type: 'date', required: true, section: 'Basic Information' },
    { key: 'description', label: 'Description', type: 'textarea', required: true, section: 'Basic Information' },
    { key: 'shift', label: 'Shift', type: 'select', options: ['A', 'B', 'C', 'General'], required: true, section: 'Basic Information' },
    { key: 'area_manager', label: 'Area Manager', type: 'text', required: true, section: 'Basic Information' },
    { key: 'gender', label: 'Gender Wise', type: 'select', options: ['Male', 'Female', 'Other'], section: 'Basic Information' },
    { key: 'location', label: 'Location', type: 'location-select', required: true, section: 'Basic Information' },
    { key: 'department_id', label: 'Department', type: 'select', options: DEPARTMENTS, required: true, section: 'Basic Information' },
    { key: 'incident_category_id', label: 'Incident Category', type: 'select', options: INCIDENT_CATEGORIES, required: true, section: 'Incident Details' },
    { key: 'root_cause_id', label: 'Root Cause', type: 'select', options: ROOT_CAUSES, required: true, section: 'Incident Details' },
    { key: 'immediate_cause', label: 'Immediate Cause', type: 'textarea', section: 'Investigation' },
    { key: 'root_cause', label: 'Root Cause', type: 'textarea', section: 'Investigation' },
    { key: 'actions', label: 'Actions', type: 'actions', section: 'Actions' },
    { key: 'evidence_upload', label: 'Evidence Upload', type: 'file', section: 'Investigation' },
    { key: 'responsible_person', label: 'Responsible Person', type: 'text', section: 'Assignment' },
    { key: 'risk_rating_id', label: 'Risk Rating', type: 'select', options: RISK_RATINGS, required: true, section: 'Assignment' },
    { key: 'timeline', label: 'Timeline', type: 'date', section: 'Assignment' },
    { key: 'status_id', label: 'Status', type: 'select', options: STATUSES, required: true, section: 'Assignment' }
  ]
};

export const actionTrackerSchema: SectionConfig = {
  id: 'action-tracker',
  title: 'Actions / CAPA',
  path: '/action-tracker',
  accentColor: '#A73A28',
  icon: 'CheckSquare',
  columns: [
    { key: 's_no', label: 'Sr. #', type: 'text', hideFromForm: true, compute: d => d.s_no || '' },
    { key: 'date', label: 'Date', type: 'date', required: true, section: 'Action Information' },
    { key: 'month', label: 'Month', type: 'text', readonly: true, compute: d => d.date ? new Date(d.date).toLocaleString('default', { month: 'short', year: 'numeric' }) : '', section: 'Action Information' },
    { key: 'auditor_name', label: 'Auditor Name', type: 'text', required: true, section: 'Action Information' },
    { key: 'action_driven_from', label: 'Action Driven From', type: 'text', required: true, section: 'Action Information' },
    { key: 'audit_description', label: 'Audit Description', type: 'text', required: true, section: 'Action Information' },
    { key: 'area_clauses', label: 'Area/Clauses', type: 'text', required: true, section: 'Action Details' },
    { key: 'actions_recommendation', label: 'Actions / Recommendation', type: 'textarea', required: true, section: 'Action Details' },
    { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High'], required: true, section: 'Action Details' },
    { key: 'department_id', label: 'Responsible Department', type: 'select', options: DEPARTMENTS, required: true, section: 'Assignment' },
    { key: 'responsible_manager', label: 'Responsible Manager', type: 'text', required: true, section: 'Assignment' },
    { key: 'target_date', label: 'Target Date', type: 'date', required: true, section: 'Assignment' },
    { key: 'status_id', label: 'Action Item Status', type: 'select', options: STATUSES, required: true, section: 'Assignment' }
  ]
};

export const trainingRecordsSchema: SectionConfig = {
  id: 'training-records',
  title: 'Training Records',
  path: '/training-records',
  accentColor: '#8A7D5C',
  icon: 'Users',
  columns: [
    { key: 'date', label: 'Date', type: 'date', required: true, section: 'Training Details' },
    { key: 'training_type', label: 'Training Type', type: 'select', options: ['Internal', 'External', 'Toolbox Talk', 'Safety Briefing', 'Fire Drill', 'Orientation', 'Other'], required: true, section: 'Training Details' },
    // Populated from GET /departments?isActive=true. Values are UUIDs; labels
    // are the department name and code returned by the master-data API.
    { key: 'department_id', label: 'Department', type: 'select', options: [], required: true, section: 'Training Details' },
    { key: 'trainer', label: 'Trainer', type: 'text', required: true, section: 'Training Details' },
    { key: 'venue', label: 'Venue', type: 'text', section: 'Training Details' },
    { key: 'topic', label: 'Topics Delivered', type: 'textarea', required: true, section: 'Training Details' },
    { key: 'participants', label: 'Total Participants', type: 'number', required: true, section: 'Training Details' },
    { key: 'duration_minutes', label: 'Duration (Min)', type: 'number', required: true, section: 'Training Details' },
    {
      key: 'manhours',
      label: 'Manhours',
      type: 'number',
      readonly: true,
      section: 'Summary',
      compute: (data: any) => {
        const p = parseFloat(data.participants);
        const d = parseFloat(data.duration_minutes);
        if (!Number.isFinite(p) || !Number.isFinite(d)) return '';
        return (p * (d / 60)).toFixed(2);
      }
    },
    {
      key: 'total_manhours',
      label: 'Total Manhours',
      type: 'number',
      readonly: true,
      section: 'Summary',
      compute: (data: any, allEntries?: any[]) => {
        if (!allEntries) return 0;
        const deptEntries = allEntries.filter(e => e.department_id === data.department_id);
        const prevTotal = deptEntries.reduce((sum, e) => {
          if (e.id === data.id) return sum;
          return sum + (parseFloat(e.manhours) || 0);
        }, 0);
        const currentManhours = parseFloat(data.manhours) || 0;
        return (prevTotal + currentManhours).toFixed(2);
      }
    }
  ]
};

export const auditManagementSchema: SectionConfig = {
  id: 'audit-management',
  title: 'Audit Management',
  path: '/audit-management',
  accentColor: '#8B5CF6',
  icon: 'ClipboardList',
  columns: [
    { key: 'auditNumber', label: 'Audit Number', type: 'text', readonly: true, section: 'Audit Details' },
    { key: 'title', label: 'Title', type: 'text', required: true, section: 'Audit Details' },
    { key: 'auditType', label: 'Audit Type', type: 'select', options: ['internal', 'external', 'regulatory'], required: true, section: 'Audit Details' },
    { key: 'status', label: 'Status', type: 'select', options: ['planned', 'in_progress', 'completed', 'cancelled'], required: true, section: 'Audit Details' },
    { key: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true, section: 'Schedule' },
    { key: 'completedDate', label: 'Completed Date', type: 'date', section: 'Schedule' },
    { key: 'scope', label: 'Scope / Objective', type: 'textarea', section: 'Audit Details' },
    { key: 'summary', label: 'Summary', type: 'textarea', section: 'Audit Details' }
  ]
};

export const inspectionRecordsSchema: SectionConfig = {
  id: 'inspection-records',
  title: 'Inspection Records',
  path: '/inspection-records',
  accentColor: '#F59E0B',
  icon: 'CheckSquare',
  columns: [
    { key: 's_no', label: 'Sr. #', type: 'text', hideFromForm: true, compute: d => d.s_no || '' },
    { key: 'standard_reference', label: 'Standard Reference', type: 'text', required: true, section: 'Inspection Point' },
    { key: 'audit_point', label: 'Audit Point', type: 'text', required: true, section: 'Inspection Point' },
    { key: 'standard_limit', label: 'Standard Limit/Requirement', type: 'text', required: true, section: 'Inspection Point' },
    { key: 'actions_recommendations', label: 'Actions / Recommendations', type: 'textarea', required: true, section: 'Findings' },
    { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High'], required: true, section: 'Findings' },
    { key: 'target_date', label: 'Target Date for Completion', type: 'date', required: true, section: 'Findings' },
    { key: 'responsibility', label: 'Responsibility', type: 'text', required: true, section: 'Action Assignment' },
    { key: 'department_id', label: 'Responsible Department', type: 'select', options: DEPARTMENTS, required: true, section: 'Action Assignment' },
    { key: 'status_id', label: 'Closure Status', type: 'select', options: ['Open', 'Closed'], required: true, section: 'Action Assignment' },
    { key: 'pictorial', label: 'Pictorial', type: 'file', section: 'Action Assignment' }
  ]
};

export const criticalAuditPlanSchema: SectionConfig = {
  id: 'critical-audit-plan',
  title: 'Critical Audit Plan',
  path: '/critical-audit-plan',
  accentColor: '#10B981',
  icon: 'Calendar',
  columns: [
    { key: 'auditNumber', label: 'Audit Number', type: 'text', readonly: true, section: 'Audit Details' },
    { key: 'title', label: 'Area Name', type: 'text', required: true, section: 'Audit Area' },
    { key: 'auditType', label: 'Audit Type', type: 'select', options: ['internal', 'external', 'regulatory'], required: true, section: 'Audit Area' },
    { key: 'status', label: 'Status', type: 'select', options: ['planned', 'in_progress', 'completed', 'cancelled'], required: true, section: 'Audit Area' },
    { key: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: true, section: 'Schedule' },
    { key: 'completedDate', label: 'Completed Date', type: 'date', section: 'Schedule' },
    { key: 'scope', label: 'Audit Objective', type: 'textarea', section: 'Audit Area' },
    { key: 'summary', label: 'Frequency & Owners', type: 'textarea', section: 'Planning' }
  ]
};

export const ALL_SECTIONS = [
  hazardReportingSchema,
  nearMissSchema,
  incidentLogSchema,
  trainingRecordsSchema,
  actionTrackerSchema,
  auditManagementSchema,
  inspectionRecordsSchema,
  criticalAuditPlanSchema
];

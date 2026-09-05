import type { DashboardAnalyticsDataset } from '@cbl/api';

export type DashboardChartOption = {
  value: string;
  label: string;
  title: string;
  groupBy: string;
  metric?: 'count' | 'sessions' | 'manhours' | 'participants';
};

export type DashboardChartDefinition = {
  dataset: DashboardAnalyticsDataset;
  path: string;
  color: string;
  defaultOption: string;
  options: DashboardChartOption[];
};

const incidentOptions: DashboardChartOption[] = [
  { value: 'department', label: 'By Department', title: 'Incidents by Department', groupBy: 'department' },
  { value: 'category', label: 'By Category', title: 'Incidents by Category', groupBy: 'category' },
  { value: 'severity', label: 'By Severity', title: 'Incidents by Severity', groupBy: 'severity' },
  { value: 'status', label: 'By Status', title: 'Incidents by Status', groupBy: 'status' },
  { value: 'month', label: 'By Month', title: 'Incidents by Month', groupBy: 'month' },
  { value: 'year', label: 'By Year', title: 'Incidents by Year', groupBy: 'year' },
  { value: 'location', label: 'By Location', title: 'Incidents by Location', groupBy: 'location' },
];

const hazardOptions: DashboardChartOption[] = [
  { value: 'category', label: 'By Category', title: 'Top Hazard Categories', groupBy: 'category' },
  { value: 'department', label: 'By Department', title: 'Hazards by Department', groupBy: 'department' },
  { value: 'responsibleDepartment', label: 'By Responsible Dept', title: 'Hazards by Responsible Department', groupBy: 'responsibleDepartment' },
  { value: 'riskRating', label: 'By Risk Rating', title: 'Hazards by Risk Rating', groupBy: 'riskRating' },
  { value: 'status', label: 'By Status', title: 'Hazards by Status', groupBy: 'status' },
  { value: 'month', label: 'By Month', title: 'Hazards by Month', groupBy: 'month' },
  { value: 'year', label: 'By Year', title: 'Hazards by Year', groupBy: 'year' },
  { value: 'location', label: 'By Location', title: 'Hazards by Location', groupBy: 'location' },
  { value: 'hazardType', label: 'By Hazard Type', title: 'Hazards by Type', groupBy: 'hazardType' },
];

export const DASHBOARD_CHARTS: Record<string, DashboardChartDefinition> = {
  incidentDepartment: {
    dataset: 'incidents', path: '/incident-log', color: '#CB0017', defaultOption: 'department', options: incidentOptions,
  },
  hazardCategory: {
    dataset: 'hazards', path: '/hazard-reporting', color: '#D97706', defaultOption: 'category', options: hazardOptions,
  },
  training: {
    dataset: 'training', path: '/training-records', color: '#16811B', defaultOption: 'manhoursDepartment',
    options: [
      { value: 'manhoursDepartment', label: 'Manhours by Dept', title: 'Training Manhours by Dept', groupBy: 'department', metric: 'manhours' },
      { value: 'manhoursMonth', label: 'Manhours by Month', title: 'Training Manhours by Month', groupBy: 'month', metric: 'manhours' },
      { value: 'sessionsDepartment', label: 'Sessions by Dept', title: 'Training Sessions by Department', groupBy: 'department', metric: 'sessions' },
      { value: 'participantsDepartment', label: 'Participants by Dept', title: 'Training Participants by Department', groupBy: 'department', metric: 'participants' },
      { value: 'sessionsType', label: 'Sessions by Type', title: 'Training Sessions by Type', groupBy: 'trainingType', metric: 'sessions' },
      { value: 'sessionsStatus', label: 'Sessions by Status', title: 'Training Sessions by Status', groupBy: 'status', metric: 'sessions' },
      { value: 'sessionsMonth', label: 'Sessions by Month', title: 'Training Sessions by Month', groupBy: 'month', metric: 'sessions' },
      { value: 'sessionsYear', label: 'Sessions by Year', title: 'Training Sessions by Year', groupBy: 'year', metric: 'sessions' },
      { value: 'sessionsLocation', label: 'Sessions by Location', title: 'Training Sessions by Location', groupBy: 'location', metric: 'sessions' },
    ],
  },
  capa: {
    dataset: 'capa', path: '/action-tracker', color: '#16A34A', defaultOption: 'status',
    options: [
      { value: 'status', label: 'By Status', title: 'CAPA Status Distribution', groupBy: 'status' },
      { value: 'department', label: 'By Responsible Dept', title: 'CAPA by Responsible Department', groupBy: 'department' },
      { value: 'category', label: 'By Incident Category', title: 'CAPA by Incident Category', groupBy: 'category' },
      { value: 'source', label: 'By Source Module', title: 'CAPA by Source Module', groupBy: 'source' },
      { value: 'priority', label: 'By Risk / Priority', title: 'CAPA by Risk / Priority', groupBy: 'priority' },
      { value: 'month', label: 'By Month', title: 'CAPA by Month', groupBy: 'month' },
      { value: 'year', label: 'By Year', title: 'CAPA by Year', groupBy: 'year' },
    ],
  },
  nearMiss: {
    dataset: 'near-misses', path: '/near-miss', color: '#2563EB', defaultOption: 'department',
    options: [
      { value: 'department', label: 'By Department', title: 'Near Misses by Department', groupBy: 'department' },
      { value: 'responsibleDepartment', label: 'By Responsible Dept', title: 'Near Misses by Responsible Department', groupBy: 'responsibleDepartment' },
      { value: 'status', label: 'By Status', title: 'Near Misses by Status', groupBy: 'status' },
      { value: 'month', label: 'By Month', title: 'Near Misses by Month', groupBy: 'month' },
      { value: 'year', label: 'By Year', title: 'Near Misses by Year', groupBy: 'year' },
      { value: 'location', label: 'By Location', title: 'Near Misses by Location', groupBy: 'location' },
      { value: 'investigationRequired', label: 'By Investigation Flag', title: 'Near Misses by Further Investigation', groupBy: 'investigationRequired' },
      { value: 'reportedInHazard', label: 'By Hazard Reporting Flag', title: 'Near Misses Reported in Hazard', groupBy: 'reportedInHazard' },
    ],
  },
  fire: {
    dataset: 'fire', path: '/lagging-indicators/fire', color: '#DC2626', defaultOption: 'department',
    options: [
      { value: 'department', label: 'By Department', title: 'Fire Incidents by Department', groupBy: 'department' },
      { value: 'month', label: 'By Month', title: 'Fire Incidents by Month', groupBy: 'month' },
      { value: 'year', label: 'By Year', title: 'Fire Incidents by Year', groupBy: 'year' },
      { value: 'location', label: 'By Location', title: 'Fire Incidents by Location', groupBy: 'location' },
      { value: 'severity', label: 'By Severity', title: 'Fire Incidents by Severity', groupBy: 'severity' },
      { value: 'status', label: 'By Status', title: 'Fire Incidents by Status', groupBy: 'status' },
      { value: 'category', label: 'By Fire Type', title: 'Fire Incidents by Type', groupBy: 'category' },
    ],
  },
  audits: {
    dataset: 'audits', path: '/audit-management', color: '#7C3AED', defaultOption: 'status',
    options: [
      { value: 'status', label: 'By Status', title: 'Audit Logs by Status', groupBy: 'status' },
      { value: 'riskRating', label: 'By Risk Rating', title: 'Audit Logs by Risk Rating', groupBy: 'riskRating' },
      { value: 'auditor', label: 'By Auditor', title: 'Audit Logs by Auditor', groupBy: 'auditor' },
      { value: 'month', label: 'By Month', title: 'Audit Logs by Month', groupBy: 'month' },
      { value: 'year', label: 'By Year', title: 'Audit Logs by Year', groupBy: 'year' },
      { value: 'area', label: 'By Area', title: 'Audit Logs by Area', groupBy: 'area' },
      { value: 'frequency', label: 'By Frequency', title: 'Audit Logs by Frequency', groupBy: 'frequency' },
    ],
  },
};

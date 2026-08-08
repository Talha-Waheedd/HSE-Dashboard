import { useMemo } from 'react';

export interface DashboardRawData {
  hazards: any[];
  nearMisses: any[];
  incidents: any[];
  capas: any[];
  training: any[];
  inspections: any[];
  drills: any[];
  legal: any[];
  audits: any[];
  aggregate?: any;
  totalOrgManhours?: number; // Configurable / Inputted elsewhere later
}

export interface MetricItem {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  target?: number | string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  isPendingModule?: boolean;
  path?: string;
  iconClass?: string;
  bgClass?: string;
}

export const useDashboardMetrics = (data: DashboardRawData) => {
  return useMemo(() => {
    const { 
      hazards = [], 
      nearMisses = [], 
      incidents = [], 
      capas = [], 
      training = [], 
      inspections = [], 
      audits = [],
      aggregate,
      totalOrgManhours = 0
    } = data;

    // --- Leading Indicators ---
    const hazardSpotting = aggregate?.hazards?.total ?? hazards.length;
    const nearMissCount = aggregate?.nearMisses?.total ?? nearMisses.length;
    
    // Unsafe Acts
    const unsafeActs = hazards.filter(h => 
      h.category === 'Behavioral' || 
      h.root_cause === 'Unsafe Act' ||
      h.root_cause === 'Human Error'
    ).length;

    const closedHazards = aggregate?.hazards
      ? (Number(aggregate.hazards.Closed) || 0) + (Number(aggregate.hazards.closed) || 0) + (Number(aggregate.hazards.Close) || 0)
      : hazards.filter(h => h.status_id === 'Closed' || h.status_id === 'Close').length;
    const hazardClosureTotal = aggregate?.hazards?.total ?? hazards.length;
    const hazardClosureRate = hazardClosureTotal > 0 ? Math.round((closedHazards / hazardClosureTotal) * 100) : 0;

    const totalTrainingManhours = Math.round(training.reduce((sum, t) => sum + (Number(t.manhours || t.total_manhours) || 0), 0));
    
    // 🚨 No real data sources yet
    // drills.length;
    // legal.length;

    const incidentCapas = capas.filter(c => c.source === 'Incident' || c.module_source === 'incident-log');
    const closedIncidentCapas = incidentCapas.filter(c => c.status_id === 'Closed' || c.status_id === 'Close').length;
    const incidentCapaClosureRate = incidentCapas.length > 0 ? Math.round((closedIncidentCapas / incidentCapas.length) * 100) : 0;

    const closedCapas = capas.filter(c => c.status_id === 'Closed' || c.status_id === 'Close').length;
    const capaClosureRate = capas.length > 0 ? Math.round((closedCapas / capas.length) * 100) : 0;

    const leadingMetricsDetail: MetricItem[] = [
      { id: 'hazard-spotting', name: 'Hazard Spotting', value: hazardSpotting, unit: 'Count', status: 'neutral', path: '/hazard-reporting', iconClass: 'text-rose-600', bgClass: 'bg-rose-100' },
      { id: 'near-miss', name: 'Near Miss', value: nearMissCount, unit: 'Count', status: 'neutral', path: '/near-miss', iconClass: 'text-amber-600', bgClass: 'bg-amber-100' },
      { id: 'unsafe-acts', name: 'Unsafe Acts', value: unsafeActs, unit: 'Count', status: unsafeActs > 0 ? 'warning' : 'success', path: '/hazard-reporting', iconClass: 'text-orange-600', bgClass: 'bg-orange-100' },
      { id: 'hazard-closure', name: 'Hazard Closure', value: hazardClosureRate, unit: '%', target: 100, status: hazardClosureRate >= 80 ? 'success' : 'warning', path: '/hazard-reporting', iconClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
      { id: 'training-manhours', name: 'HSE Training Manhours', value: totalTrainingManhours, unit: 'Hrs', status: 'success', path: '/training-records', iconClass: 'text-cyan-600', bgClass: 'bg-cyan-100' },
      { id: 'inspections', name: 'HSE Inspections/Audits', value: aggregate ? (Number(aggregate.inspections?.total) || 0) + (Number(aggregate.audits?.total) || 0) : inspections.length + audits.length, unit: 'Count', status: 'success', path: '/audit-management', iconClass: 'text-violet-600', bgClass: 'bg-violet-100' },
      { id: 'incident-capa-closure', name: 'Incident Inv. Actions Closure', value: incidentCapaClosureRate, unit: '%', target: 100, status: incidentCapaClosureRate >= 80 ? 'success' : 'warning', path: '/action-tracker', iconClass: 'text-indigo-600', bgClass: 'bg-indigo-100' },
      { id: 'drills', name: 'Emergency Drills (Int/Ext)', value: 'N/A', unit: 'Module Pending', status: 'neutral', isPendingModule: true },
      { id: 'capa-closure', name: 'Action Plans Closure Tracker', value: capaClosureRate, unit: '%', target: 100, status: capaClosureRate >= 80 ? 'success' : 'warning', path: '/action-tracker', iconClass: 'text-violet-600', bgClass: 'bg-violet-100' },
      { id: 'legal', name: 'Legal Compliance', value: 'N/A', unit: 'Module Pending', status: 'neutral', isPendingModule: true },
    ];

    // --- Lagging Indicators ---
    const fatalities = aggregate?.incidents ? Number(aggregate.incidents.Fatality) || 0 : incidents.filter(i => i.incident_category_id === 'Fatality').length;
    const lti = aggregate?.incidents ? Number(aggregate.incidents.LTI) || 0 : incidents.filter(i => i.incident_category_id === 'LTI').length;
    const rwcMtc = aggregate?.incidents ? (Number(aggregate.incidents.RWC) || 0) + (Number(aggregate.incidents.MTC) || 0) : incidents.filter(i => ['RWC', 'MTC'].includes(i.incident_category_id)).length;
    const firstAid = aggregate?.incidents ? Number(aggregate.incidents['First Aid']) || 0 : incidents.filter(i => i.incident_category_id === 'First Aid').length;
    const fireMinor = aggregate?.incidents ? Number(aggregate.incidents['Minor Fire']) || 0 : incidents.filter(i => i.incident_category_id === 'Minor Fire').length;
    const fireMajor = aggregate?.incidents ? Number(aggregate.incidents['Major Fire']) || 0 : incidents.filter(i => i.incident_category_id === 'Major Fire').length;
    
    const recordableIncidents = fatalities + lti + rwcMtc;
    const ltir = totalOrgManhours > 0 ? ((lti * 200000) / totalOrgManhours).toFixed(2) : '0.00';
    const trir = totalOrgManhours > 0 ? ((recordableIncidents * 200000) / totalOrgManhours).toFixed(2) : '0.00';

    const laggingMetricsDetail: MetricItem[] = [
      { id: 'fatalities', name: 'Fatal Incidents', value: fatalities, unit: 'Count', target: 0, status: fatalities > 0 ? 'danger' : 'success', path: '/incident-log', iconClass: 'text-red-700', bgClass: 'bg-red-100' },
      { id: 'lti', name: 'LTI (Lost Time Injury)', value: lti, unit: 'Count', target: 0, status: lti > 0 ? 'danger' : 'success', path: '/incident-log', iconClass: 'text-pink-600', bgClass: 'bg-pink-100' },
      { id: 'ltir', name: 'LTIR', value: ltir, unit: 'Rate', target: 0, status: Number(ltir) > 0 ? 'warning' : 'success', path: '/incident-log', iconClass: 'text-fuchsia-600', bgClass: 'bg-fuchsia-100' },
      { id: 'rwc-mtc', name: 'RWC / MTC', value: rwcMtc, unit: 'Count', status: rwcMtc > 0 ? 'warning' : 'success', path: '/incident-log', iconClass: 'text-orange-500', bgClass: 'bg-orange-100' },
      { id: 'trir', name: 'TRIR', value: trir, unit: 'Rate', target: 0, status: Number(trir) > 0 ? 'warning' : 'success', path: '/incident-log', iconClass: 'text-yellow-600', bgClass: 'bg-yellow-100' },
      { id: 'first-aid', name: 'First Aid', value: firstAid, unit: 'Count', status: firstAid > 0 ? 'warning' : 'success', path: '/incident-log', iconClass: 'text-emerald-500', bgClass: 'bg-emerald-100' },
      { id: 'fire', name: 'Fire Incidents (Major / Minor)', value: `${fireMajor} / ${fireMinor}`, unit: 'Count', target: 0, status: (fireMajor > 0 || fireMinor > 0) ? 'danger' : 'success', path: '/incident-log', iconClass: 'text-red-500', bgClass: 'bg-red-100' },
    ];

    return {
      leadingMetricsDetail,
      laggingMetricsDetail
    };
  }, [data]);
};

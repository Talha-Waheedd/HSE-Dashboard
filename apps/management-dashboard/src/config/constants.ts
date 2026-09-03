export const INCIDENT_CATEGORIES = [
  'First Aid',
  'MTC',
  'RWC',
  'LTI',
  'Fatality',
  'Fire'
];

export const HAZARD_CATEGORIES = [
  'Electrical Hazard',
  'Pinch Point Hazard',
  'Entanglement Hazard',
  'Caught-In/Caught-Between Hazard',
  'Struck-By Hazard',
  'Slip, Trip & Fall Hazard',
  'Working at Height Hazard',
  'Chemical Exposure Hazard',
  'Fire Hazard',
  'Explosion Hazard',
  'Hot Surface / Thermal Hazard',
  'Confined Space Hazard',
  'Manual Handling Hazard',
  'Ergonomic Hazard',
  'Noise Hazard',
  'Dust Exposure Hazard',
  'Moving Vehicle / Traffic Hazard',
  'Pressure System Hazard',
  'Stored Energy Hazard (LOTO)',
  'Biological Hazard',
  'Sharp Edge Hazard',
  'Falling Object Hazard',
  'Material Handling Equipment Hazard',
  'Poor Housekeeping Hazard',
  'Compressed Gas Hazard',
  'Machine Guarding Hazard',
  'Line of Fire Hazard',
  'Overhead Load Hazard',
  'Hot Work Hazard',
  'Hand Tool Hazard'
];

export const CONTRACTORS = [
  'Deecon',
  'RF Associates',
  'Wahaj Associates',
  'AHS Engineering',
  'Orient',
  'Mujahid ENG',
  'Royal ENG',
  'Sarmad ENG',
  'Siddiqui ENG',
  'Noor ENG',
  'Niazi Riggers',
  'Haneef ENG',
  'Other'
];

export const ROOT_CAUSES = [
  'Human Error',
  'Unsafe Act',
  'Unsafe Condition',
  'Poor Housekeeping',
  'Improper PPE',
  'Equipment Failure',
  'No SOP/Procedure',
  'Training Gap'
];

export const RISK_RATINGS = [
  'Low',
  'Medium',
  'High'
];

export const STATUSES = [
  'Open',
  'Closed',
  'Pending',
  'Work in Progress',
  'Cancelled'
];

export const CHART_COLORS = {
  // CBL Brand
  primary:  '#CB0017', // CBL Crimson
  maroon:   '#6E000C', // Deep Red
  dark:     '#1A1818', // Charcoal
  // Semantic enterprise palette (SAP / Microsoft Dynamics)
  danger:   '#CB0017', // Red — incidents, overdue
  warning:  '#DC8E00', // Amber — open, pending
  success:  '#1B7C1B', // Green — closed, compliant
  info:     '#2563EB', // Blue — in-progress, informational
  neutral:  '#6B7280', // Grey — neutral
  amber:    '#DC8E00', // alias for warning
  // Legacy keys (kept for compatibility)
  caramel:   '#CB0017',
  mutedGreen:'#1B7C1B',
  softGrey:  '#E5E7EB',
  darkBrown: '#1A1818',
};

// Pie chart palette — meaningful color progression
export const PIE_COLORS = [
  '#CB0017', // Red — critical / high
  '#DC8E00', // Amber — medium / open
  '#1B7C1B', // Green — low / closed
  '#2563EB', // Blue — informational
  '#6B7280', // Grey — neutral / cancelled
  '#6E000C', // Deep red — fatality-level
];

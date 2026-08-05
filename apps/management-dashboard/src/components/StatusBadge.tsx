import React from 'react';

// ============================================================
// StatusBadge — Unified enterprise status chip
// SAP Fiori / Microsoft Dynamics 365 semantic color palette
// ============================================================

interface StatusConfig {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Open / Active states
  'Open':             { bg: '#FEF9EC', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  'Pending':          { bg: '#FEF9EC', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  'Assigned':         { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  'Submitted for Review': { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', dot: '#8B5CF6' },
  'Reopened':         { bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74', dot: '#F97316' },
  'Rejected':         { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },

  // In-progress states
  'Work in Progress': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  'In Progress':      { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  'Investigating':    { bg: '#A16207', text: '#FFFFFF', border: '#A16207', dot: '#FFFFFF' },
  'INVESTIGATING':    { bg: '#A16207', text: '#FFFFFF', border: '#A16207', dot: '#FFFFFF' },
  'Moderate':         { bg: '#D97706', text: '#FFFFFF', border: '#D97706', dot: '#FFFFFF' },
  'MODERATE':         { bg: '#D97706', text: '#FFFFFF', border: '#D97706', dot: '#FFFFFF' },

  // Closed / Success states
  'Closed':           { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  'Close':            { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  'Approved':         { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  'Completed':        { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', dot: '#10B981' },

  // Terminal / Cancelled states
  'Cancelled':        { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB', dot: '#9CA3AF' },

  // ================================================================
  // Risk Ratings — SOLID FILLED pills (Stitch design)
  // White text on solid colored background (no dot needed)
  // ================================================================
  'Low':      { bg: '#374151', text: '#FFFFFF', border: '#374151', dot: '#FFFFFF' },
  'Medium':   { bg: '#D97706', text: '#FFFFFF', border: '#D97706', dot: '#FFFFFF' },
  'High':     { bg: '#B91C1C', text: '#FFFFFF', border: '#B91C1C', dot: '#FFFFFF' },
  'Critical': { bg: '#7B1010', text: '#FFFFFF', border: '#7B1010', dot: '#FFFFFF' },
  '4 (LOW)':      { bg: '#374151', text: '#FFFFFF', border: '#374151', dot: '#FFFFFF' },
  '12 (MED)':     { bg: '#D97706', text: '#FFFFFF', border: '#D97706', dot: '#FFFFFF' },
  '20 (HIGH)':    { bg: '#B91C1C', text: '#FFFFFF', border: '#B91C1C', dot: '#FFFFFF' },
  '25 (CRITICAL)':{ bg: '#7B1010', text: '#FFFFFF', border: '#7B1010', dot: '#FFFFFF' },

  // Investigation
  'Yes':              { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  'No':               { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB', dot: '#9CA3AF' },
};

const DEFAULT_CONFIG: StatusConfig = {
  bg: '#F3F4F6', text: '#374151', border: '#E5E7EB', dot: '#9CA3AF'
};

interface StatusBadgeProps {
  status: string;
  showDot?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = true,
  size = 'sm',
  className = '',
}) => {
  const config = STATUS_MAP[status] ?? DEFAULT_CONFIG;

  // For Risk Rating badges: hide dot since bg is solid colored
  const isRiskRating = ['Low','Medium','High','Critical','4 (LOW)','12 (MED)','20 (HIGH)','25 (CRITICAL)'].includes(status)
    || ['MODERATE','Moderate','Investigating','INVESTIGATING'].includes(status);
  const effectiveShowDot = showDot && !isRiskRating;

  // Normalize display label
  const label =
    status === 'Close' ? 'Closed' :
    status === 'Work in Progress' ? 'In Progress' :
    status;

  const sizeClasses =
    size === 'xs' ? 'text-[10px] px-1.5 py-0' :
    size === 'sm' ? 'text-[11px] px-2 py-0.5' :
                   'text-[12px] px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded tracking-wide uppercase whitespace-nowrap ${sizeClasses} ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {effectiveShowDot && (
        <span
          className="inline-block rounded-full shrink-0"
          style={{ width: 5, height: 5, backgroundColor: config.dot }}
        />
      )}
      {label}
    </span>
  );
};

export default StatusBadge;

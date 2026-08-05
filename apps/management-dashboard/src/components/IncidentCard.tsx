import React from 'react';
import { StatusBadge } from './StatusBadge';
import { Clock, Tag, ChevronRight, User } from 'lucide-react';

// ============================================================
// IncidentCard — Expanded list view card for Incident Log
// Used in the Stitch design for /incident-log
// ============================================================

interface Incident {
  id: string;
  date: string;
  department_id: string;
  incident_category_id: string;
  risk_rating_id: string;
  status_id: string;
  description: string;
  reported_by: string;
  shift?: string;
  rca_status?: string;
}

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
  className?: string;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E8E0C8] rounded-xl p-5 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#D5CCAC] ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-[12px] font-bold text-[#1C1C1E] bg-[#F5F0DC] px-2 py-0.5 rounded uppercase tracking-wider">
              {incident.id || 'INC-NEW'}
            </span>
            <StatusBadge status={incident.risk_rating_id} size="sm" />
            <span className="text-[12px] font-medium text-[#6B7280] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {incident.date} {incident.shift ? `· ${incident.shift} Shift` : ''}
            </span>
          </div>
          
          <h3 className="text-[15px] font-bold text-[#1A1818] mb-1.5 leading-snug">
            {incident.description || 'No description provided'}
          </h3>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[12px] text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              {incident.incident_category_id}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Reported by {incident.reported_by}
            </span>
            <span>
              Dept: <strong className="text-[#374151]">{incident.department_id}</strong>
            </span>
          </div>
        </div>

        {/* Right status info */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start shrink-0 gap-3 border-t md:border-t-0 md:border-l border-[#F3F4F6] pt-3 md:pt-0 md:pl-5">
          <StatusBadge status={incident.status_id} size="md" />
          
          <div className="flex flex-col md:items-end text-[11px] font-medium text-[#9CA3AF]">
            {incident.rca_status && (
              <span className="uppercase tracking-wide mt-1">RCA: {incident.rca_status}</span>
            )}
            <span className="flex items-center gap-1 text-[var(--brand-maroon)] mt-2 hover:underline">
              View Details <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;

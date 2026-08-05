import React from 'react';
import { AlertTriangle, Target, FileWarning, ClipboardList } from 'lucide-react';

// ============================================================
// LinkedSourceBadge — Displays linked source references
// e.g. HAZ-882, NM-104, INC-056, AUD-22
// Extracted from Action Tracker (CAPA) Stitch design
// ============================================================

type SourceType = 'HAZ' | 'NM' | 'INC' | 'AUD' | string;

interface LinkedSourceBadgeProps {
  id: string;
  type?: SourceType;
  onClick?: () => void;
  className?: string;
}

const SOURCE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
  HAZ: {
    icon: <AlertTriangle style={{ width: 10, height: 10 }} />,
    bg: '#FEF9EC', text: '#92400E', border: '#FDE68A',
  },
  NM: {
    icon: <Target style={{ width: 10, height: 10 }} />,
    bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74',
  },
  INC: {
    icon: <FileWarning style={{ width: 10, height: 10 }} />,
    bg: '#FEF2F2', text: '#991B1B', border: '#FECACA',
  },
  AUD: {
    icon: <ClipboardList style={{ width: 10, height: 10 }} />,
    bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE',
  },
};

const DEFAULT_SOURCE = {
  icon: null,
  bg: '#F9FAFB', text: '#374151', border: '#E5E7EB',
};

export const LinkedSourceBadge: React.FC<LinkedSourceBadgeProps> = ({
  id,
  type,
  onClick,
  className = '',
}) => {
  // Auto-detect type from ID prefix if not provided
  const detectedType = type ?? (id.split('-')[0] ?? '');
  const config = SOURCE_CONFIG[detectedType] ?? DEFAULT_SOURCE;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80 ${onClick ? 'cursor-pointer' : 'cursor-default'} ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
      type="button"
    >
      {config.icon}
      <span className="font-mono tracking-wide">{id}</span>
    </button>
  );
};

export default LinkedSourceBadge;

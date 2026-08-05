import React from 'react';

// ============================================================
// DepartmentStatusBar — Horizontal progress bar with open count
// Used in Action Tracker sidebar widget from Stitch design
// ============================================================

interface DepartmentStatusBarProps {
  name: string;
  openCount: number;
  maxCount?: number;
  color?: string;
  className?: string;
}

export const DepartmentStatusBar: React.FC<DepartmentStatusBarProps> = ({
  name,
  openCount,
  maxCount = 30,
  color = '#7B1010',
  className = '',
}) => {
  const pct = Math.min(100, Math.round((openCount / maxCount) * 100));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-[#374151] truncate">{name}</span>
        <span className="text-[12px] font-semibold text-[#6B7280] shrink-0">{openCount} Open</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#E8E0C8] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default DepartmentStatusBar;

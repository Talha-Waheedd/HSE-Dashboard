import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================
// KpiTile — Flat enterprise KPI tile
// SAP Fiori Analytics Tile pattern
// ============================================================

type AccentColor = 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'neutral';

interface KpiTileProps {
  label: string;
  value: string | number;
  unit?: string;
  /** Positive = up trend, negative = down trend */
  trend?: number;
  trendLabel?: string;
  /** Optional descriptive sub-line shown below the value (e.g. "Reports vs Prev Year") */
  subtleLine?: string;
  icon: React.ReactNode;
  accent?: AccentColor;
  onClick?: () => void;
  className?: string;
}

const ACCENT_MAP: Record<AccentColor, { bar: string; iconBg: string; iconColor: string }> = {
  primary: { bar: '#7B1010', iconBg: 'rgba(123,16,16,0.08)', iconColor: '#7B1010' },
  danger:  { bar: '#B91C1C', iconBg: '#FEF2F2', iconColor: '#B91C1C' },
  warning: { bar: '#D97706', iconBg: '#FFFBEB', iconColor: '#B45309' },
  success: { bar: '#16A34A', iconBg: '#ECFDF5', iconColor: '#15803D' },
  info:    { bar: '#0C71D1', iconBg: '#EFF6FF', iconColor: '#1D4ED8' },
  neutral: { bar: '#6B7280', iconBg: '#F9FAFB', iconColor: '#374151' },
};

export const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  unit,
  trend,
  trendLabel,
  subtleLine,
  icon,
  accent = 'primary',
  onClick,
  className = '',
}) => {
  const a = ACCENT_MAP[accent];

  // For HSE: up trend on incidents is BAD (red), up trend on training is GOOD (green)
  // We let the consumer decide by using accent color as signal
  const trendBad  = accent === 'danger' || accent === 'primary';
  const trendUp   = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  const trendColor =
    trendUp   ? (trendBad ? '#DC2626' : '#16A34A') :
    trendDown ? (trendBad ? '#16A34A' : '#DC2626') :
    '#9CA3AF';

  const TrendIcon = trendUp ? TrendingUp : trendDown ? TrendingDown : Minus;

  return (
    <div
      className={`bg-white border border-[#E8E0C8] rounded-lg flex flex-col relative overflow-hidden transition-shadow duration-150
        ${onClick ? 'cursor-pointer hover:shadow-[0_4px_16px_0_rgba(0,0,0,0.12)]' : 'hover:shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]'}
        ${className}`}
      style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)', padding: '20px' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Top accent bar — 4px matching Stitch */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: a.bar }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3 mt-1">
        <p
          className="text-[12px] font-medium leading-tight"
          style={{ color: '#6B7280', maxWidth: 'calc(100% - 40px)' }}
        >
          {label}
        </p>
        <div
          className="p-1.5 rounded shrink-0"
          style={{ backgroundColor: a.iconBg, color: a.iconColor }}
        >
          <span className="[&>svg]:h-4 [&>svg]:w-4 block">{icon}</span>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mt-1">
        <span
          className="leading-none tabular-nums"
          style={{ fontSize: '32px', fontWeight: 700, color: '#1C1C1E' }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[14px] font-semibold" style={{ color: '#6B7280' }}>{unit}</span>
        )}
      </div>

      {/* Subtle description line */}
      {subtleLine && (
        <p className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>{subtleLine}</p>
      )}

      {/* Trend */}
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1 mt-2">
          {trend !== undefined && (
            <>
              <TrendIcon
                style={{ width: 12, height: 12, color: trendColor, flexShrink: 0 }}
              />
              <span className="text-[11px] font-semibold" style={{ color: trendColor }}>
                {Math.abs(trend)}
              </span>
            </>
          )}
          {trendLabel && (
            <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiTile;

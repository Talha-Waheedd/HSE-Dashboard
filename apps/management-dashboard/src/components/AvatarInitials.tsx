import React from 'react';

// ============================================================
// AvatarInitials — Circular avatar with deterministic color
// Used for Owner/Assignee fields in tables (CAPA, Incident, etc.)
// ============================================================

interface AvatarInitialsProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

// Deterministic color palette for avatars — 10 distinct colors
const AVATAR_COLORS = [
  { bg: '#7B1010', text: '#FFFFFF' }, // maroon
  { bg: '#1D4ED8', text: '#FFFFFF' }, // blue
  { bg: '#065F46', text: '#FFFFFF' }, // green
  { bg: '#6D28D9', text: '#FFFFFF' }, // purple
  { bg: '#B45309', text: '#FFFFFF' }, // amber
  { bg: '#1E40AF', text: '#FFFFFF' }, // indigo
  { bg: '#9F1239', text: '#FFFFFF' }, // rose
  { bg: '#0F766E', text: '#FFFFFF' }, // teal
  { bg: '#6B21A8', text: '#FFFFFF' }, // violet
  { bg: '#92400E', text: '#FFFFFF' }, // orange
];

const getColorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const SIZE_MAP = {
  xs: { dim: 24, font: 9 },
  sm: { dim: 28, font: 11 },
  md: { dim: 36, font: 13 },
  lg: { dim: 44, font: 16 },
};

export const AvatarInitials: React.FC<AvatarInitialsProps> = ({
  name,
  size = 'sm',
  className = '',
}) => {
  const color = getColorForName(name);
  const { dim, font } = SIZE_MAP[size];
  const initials = getInitials(name);

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-bold select-none ${className}`}
      style={{
        width: dim,
        height: dim,
        backgroundColor: color.bg,
        color: color.text,
        fontSize: font,
      }}
      title={name}
    >
      {initials}
    </div>
  );
};

export default AvatarInitials;

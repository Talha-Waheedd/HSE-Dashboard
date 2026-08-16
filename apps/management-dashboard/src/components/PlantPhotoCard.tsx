import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

// ============================================================
// PlantPhotoCard — Image card with gradient overlay caption
// Used in Dashboard from Stitch design
// e.g., "LU Sukkur Plant" and "Asset Safety Mapping" cards
// ============================================================

interface PlantPhotoCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  badge?: string;
  location?: string;
  onClick?: () => void;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'wide';
  alt?: string;
  fallbackImageUrl?: string;
}

export const PlantPhotoCard: React.FC<PlantPhotoCardProps> = ({
  imageUrl,
  title,
  subtitle,
  badge,
  location,
  onClick,
  className = '',
  aspectRatio = 'video',
  alt,
  fallbackImageUrl = '/image.png',
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const aspectClass =
    aspectRatio === 'video' ? 'aspect-video' :
    aspectRatio === 'square' ? 'aspect-square' :
    'aspect-[21/9]';

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${aspectClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {/* Background image */}
      <img
        src={currentImageUrl}
        alt={alt || `${title} safety location`}
        loading="lazy"
        decoding="async"
        onError={() => {
          if (currentImageUrl !== fallbackImageUrl) setCurrentImageUrl(fallbackImageUrl);
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(20,10,10,0.85) 0%, rgba(20,10,10,0.1) 60%, transparent 100%)'
      }} />

      {/* Optional badge top-right */}
      {badge && (
        <div className="absolute top-3 right-3">
          <span
            className="text-[11px] font-bold px-2 py-1 rounded uppercase tracking-wider"
            style={{ backgroundColor: '#7B1010', color: '#FFFFFF' }}
          >
            {badge}
          </span>
        </div>
      )}

      {/* Caption at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white text-[14px] font-bold leading-tight">{title}</p>
        {subtitle && (
          <p className="text-white/70 text-[11px] mt-0.5">{subtitle}</p>
        )}
        {location && (
          <div className="flex items-center gap-1 mt-2">
            <MapPin style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.6)' }} />
            <span className="text-[10px] text-white/60">{location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlantPhotoCard;

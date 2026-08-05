import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// ============================================================
// SafetyEventTimeline — Vertical activity timeline
// Used in Incident Log sidebar from Stitch design
// Shows: icon bullet + timestamp + event title + description
// ============================================================

export type TimelineEventType = 'critical' | 'warning' | 'success' | 'info';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  time: string;       // e.g. "Today, 08:00 AM" or "Yesterday"
  title: string;
  description?: string;
}

interface SafetyEventTimelineProps {
  events: TimelineEvent[];
  title?: string;
  className?: string;
}

const TYPE_CONFIG: Record<TimelineEventType, { icon: React.ReactNode; dotColor: string }> = {
  critical: {
    icon: <AlertCircle style={{ width: 12, height: 12 }} />,
    dotColor: '#B91C1C',
  },
  warning: {
    icon: <AlertTriangle style={{ width: 12, height: 12 }} />,
    dotColor: '#D97706',
  },
  success: {
    icon: <CheckCircle style={{ width: 12, height: 12 }} />,
    dotColor: '#16A34A',
  },
  info: {
    icon: <Clock style={{ width: 12, height: 12 }} />,
    dotColor: '#6B7280',
  },
};

export const SafetyEventTimeline: React.FC<SafetyEventTimelineProps> = ({
  events,
  title = 'Safety Event Timeline',
  className = '',
}) => {
  return (
    <div className={`bg-white border border-[#E8E0C8] rounded-lg p-4 ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <h3 className="text-[13px] font-bold text-[#1C1C1E] mb-4 uppercase tracking-wide">{title}</h3>

      <div className="relative">
        {/* Vertical connecting line */}
        <div
          className="absolute left-[15px] top-2 bottom-2 w-px"
          style={{ backgroundColor: '#E8E0C8' }}
        />

        <div className="space-y-4">
          {events.map((event) => {
            const cfg = TYPE_CONFIG[event.type];
            return (
              <div key={event.id} className="flex gap-3 relative">
                {/* Icon bullet */}
                <div
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10 bg-white border-2"
                  style={{ borderColor: cfg.dotColor, color: cfg.dotColor }}
                >
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[10px] text-[#9CA3AF] font-medium">{event.time}</p>
                  <p className="text-[12px] font-semibold text-[#1C1C1E] mt-0.5">{event.title}</p>
                  {event.description && (
                    <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">{event.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SafetyEventTimeline;

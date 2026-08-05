import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { LinkedSourceBadge } from './LinkedSourceBadge';

// ============================================================
// MyPendingWidget — Shows user's assigned pending actions
// Used in Action Tracker sidebar (Stitch design)
// ============================================================

interface PendingAction {
  id: string;
  title: string;
  dueDate: string;
  isOverdue: boolean;
  sourceId: string;
}

interface MyPendingWidgetProps {
  actions: PendingAction[];
  className?: string;
}

export const MyPendingWidget: React.FC<MyPendingWidgetProps> = ({
  actions,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-[#E8E0C8] rounded-lg overflow-hidden ${className}`}
         style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div className="px-4 py-3 border-b border-[#F3F4F6] flex items-center justify-between">
        <h3 className="text-[12px] font-bold text-[#374151] uppercase tracking-wide">My Pending Actions</h3>
        <span className="bg-[#FEF2F2] text-[#991B1B] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {actions.length}
        </span>
      </div>

      <div className="divide-y divide-[#F3F4F6]">
        {actions.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-[12px] text-[#9CA3AF]">You have no pending actions.</p>
          </div>
        ) : (
          actions.map((action) => (
            <div key={action.id} className="p-3 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-2 mb-2">
                <LinkedSourceBadge id={action.sourceId} />
                {action.isOverdue && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#B91C1C] uppercase">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                  </span>
                )}
              </div>
              <p className="text-[13px] font-semibold text-[#1A1818] leading-tight mb-1">{action.title}</p>
              <div className="flex items-center gap-1 text-[11px] font-medium text-[#6B7280]">
                <Clock className="w-3 h-3" />
                Due: {action.dueDate}
              </div>
            </div>
          ))
        )}
      </div>
      
      {actions.length > 0 && (
        <div className="px-4 py-2 border-t border-[#F3F4F6] bg-[#F9FAFB]">
          <button className="text-[11px] font-semibold text-[#7B1010] hover:underline w-full text-center">
            View All My Actions
          </button>
        </div>
      )}
    </div>
  );
};

export default MyPendingWidget;

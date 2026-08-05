import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface CenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const CenterModal: React.FC<CenterModalProps> = ({ isOpen, onClose, title, description, children }) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Centered Modal */}
      <div className="relative w-full max-w-7xl max-h-full flex flex-col bg-card rounded-xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-6 border-b border-border bg-muted/20 rounded-t-xl flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <div className="ml-3 flex h-7 items-center">
              <button
                type="button"
                className="rounded-md bg-card text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Close panel</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
      </div>
    </div>
  );
};

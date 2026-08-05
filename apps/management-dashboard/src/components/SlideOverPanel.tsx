import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SlideOverPanel: React.FC<SlideOverPanelProps> = ({ isOpen, onClose, title, description, children }) => {
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
        
        {/* Slide-over panel */}
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out">
            <div className="flex h-full flex-col bg-card border-l border-border shadow-xl">
              
              {/* Header */}
              <div className="px-6 py-6 border-b border-border bg-muted/20">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground" id="slide-over-title">
                      {title}
                    </h2>
                    {description && (
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    )}
                  </div>
                  <div className="ml-3 flex h-7 items-center">
                    <button
                      type="button"
                      className="relative rounded-md bg-transparent text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      onClick={onClose}
                    >
                      <span className="absolute -inset-2.5" />
                      <span className="sr-only">Close panel</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="relative flex-1 px-6 py-6 overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { ColumnSchema } from '../config/sectionSchemas';

interface StepWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  schema: { title: string; columns: ColumnSchema[] };
  initialData?: any;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  schema,
  initialData,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
      setCurrentStep(0);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Split columns into chunks of 4 to create steps
  const columns = schema.columns.filter(c => !c.hideFromForm && !c.readonly);
  const CHUNK_SIZE = 4;
  const steps: { title: string; fields: ColumnSchema[] }[] = [];
  
  for (let i = 0; i < columns.length; i += CHUNK_SIZE) {
    steps.push({
      title: `Step ${Math.floor(i / CHUNK_SIZE) + 1}`,
      fields: columns.slice(i, i + CHUNK_SIZE),
    });
  }

  // If there are less than 2 steps, it shouldn't be a wizard, but we'll handle it anyway
  if (steps.length === 0) {
    steps.push({ title: 'Details', fields: [] });
  }

  const handleNext = () => {
    // Basic validation for required fields in current step
    const currentFields = steps[currentStep].fields;
    const missing = currentFields.filter(f => f.required && !formData[f.key]);
    if (missing.length > 0) {
      alert(`Please fill in required fields: ${missing.map(m => m.label).join(', ')}`);
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onSave(formData);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderField = (col: ColumnSchema) => {
    const commonClass =
      "w-full h-9 px-3 text-[13px] border border-[#E0E0E0] rounded-md bg-white text-[#1A1818] " +
      "focus:outline-none focus:border-[#CB0017] focus:ring-1 focus:ring-[#CB0017]/20 transition-all";

    switch (col.type) {
      case 'textarea':
        return (
          <textarea
            value={formData[col.key] || ''}
            onChange={(e) => handleChange(col.key, e.target.value)}
            className={`${commonClass} py-2 min-h-[80px] resize-y`}
            placeholder={`Enter ${col.label.toLowerCase()}...`}
          />
        );
      case 'select':
        return (
          <select
            value={formData[col.key] || ''}
            onChange={(e) => handleChange(col.key, e.target.value)}
            className={commonClass}
          >
            <option value="">Select {col.label}</option>
            {col.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            value={formData[col.key] || ''}
            onChange={(e) => handleChange(col.key, e.target.value)}
            className={commonClass}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={formData[col.key] || ''}
            onChange={(e) => handleChange(col.key, e.target.value)}
            className={commonClass}
            placeholder="0"
          />
        );
      default:
        return (
          <input
            type="text"
            value={formData[col.key] || ''}
            onChange={(e) => handleChange(col.key, e.target.value)}
            className={commonClass}
            placeholder={`Enter ${col.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ border: '1px solid #E0E0E0' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0] bg-[#FAFAFA]">
          <div>
            <h2 className="text-[16px] font-bold text-[#1A1818] leading-tight">
              {initialData ? `Edit ${schema.title}` : `New ${schema.title}`}
            </h2>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Please fill out the details below</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-[#1A1818] hover:bg-[#F5F5F5] rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-6 py-4 bg-white border-b border-[#F0F0F0]">
          <div className="flex items-center">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold border-2 transition-colors
                        ${isCompleted ? 'bg-[#CB0017] border-[#CB0017] text-white' : 
                          isCurrent ? 'bg-white border-[#CB0017] text-[#CB0017]' : 
                          'bg-white border-[#E0E0E0] text-[#9CA3AF]'}`}
                    >
                      {isCompleted ? <Check className="h-3 w-3" /> : idx + 1}
                    </div>
                    <span className={`text-[12px] font-medium hidden sm:block ${isCurrent ? 'text-[#1A1818]' : 'text-[#6B7280]'}`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 rounded-full ${idx < currentStep ? 'bg-[#CB0017]' : 'bg-[#E0E0E0]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-[#FAFAFA] flex-1 overflow-y-auto">
          <div className="space-y-5">
            {steps[currentStep].fields.map((col) => (
              <div key={col.key}>
                <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 flex items-center gap-1">
                  {col.label}
                  {col.required && <span className="text-[#CB0017]">*</span>}
                </label>
                {renderField(col)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#F0F0F0] bg-white flex items-center justify-between">
          <button
            onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onClose()}
            className="px-4 h-9 text-[13px] font-medium text-[#374151] border border-[#E0E0E0] rounded-md hover:bg-[#F5F5F5] transition-colors"
          >
            {currentStep > 0 ? 'Back' : 'Cancel'}
          </button>
          
          <button
            onClick={handleNext}
            className="px-6 h-9 text-[13px] font-medium text-white bg-[#CB0017] rounded-md hover:bg-[#A8001A] transition-colors"
          >
            {currentStep === steps.length - 1 ? (initialData ? 'Save Changes' : 'Submit') : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useId, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import type { AttachmentRecord } from '../../../../packages/api/src/uploadClient';

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

const validateImageFile = (file: File): string | null => {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return 'Only JPG, JPEG, and PNG images are allowed.';
  }
  if (file.size > MAX_IMAGE_SIZE) return 'Image size must not exceed 10 MB.';
  return null;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface ImageUploadFieldProps {
  label: string;
  file?: File | null;
  existingAttachment?: AttachmentRecord | null;
  existingPreviewUrl?: string | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export const ImageUploadField = ({
  label,
  file = null,
  existingAttachment = null,
  existingPreviewUrl = null,
  onFileChange,
  disabled = false,
}: ImageUploadFieldProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPreviewUrl);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(existingPreviewUrl);
      return undefined;
    }
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    return () => URL.revokeObjectURL(localUrl);
  }, [file, existingPreviewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    const error = validateImageFile(nextFile);
    if (error) {
      setValidationError(error);
      onFileChange(null);
      event.currentTarget.value = '';
      return;
    }
    setValidationError(null);
    onFileChange(nextFile);
  };

  const removeNewFile = () => {
    setValidationError(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayName = file?.name || existingAttachment?.originalName;
  const displaySize = file?.size || existingAttachment?.sizeBytes || null;

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E0E0E0] bg-white text-[#9CA3AF]">
            {previewUrl ? <img src={previewUrl} alt={`${label} preview`} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#1A1818]">{displayName || label}</p>
            <p className="mt-1 text-[11px] text-[#9CA3AF]">
              {displaySize ? `${formatFileSize(Number(displaySize))} · ` : ''}
              {file ? 'New image selected' : existingAttachment ? 'Existing evidence' : 'No image selected'}
            </p>
          </div>
          {file && (
            <button type="button" onClick={removeNewFile} aria-label={`Remove ${label}`} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#6B7280] hover:bg-[#FEE2E2] hover:text-[#CB0017]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor={inputId} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-[12px] font-semibold text-[#475569] hover:bg-[#F8FAFC] ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <Upload className="h-3.5 w-3.5" />
            {displayName ? 'Replace image' : 'Choose image'}
          </label>
          <span className="text-[11px] text-[#94A3B8]">JPG, JPEG or PNG · Maximum 10 MB</span>
        </div>
        <input ref={inputRef} id={inputId} type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={handleFileChange} disabled={disabled} />
      </div>
      {validationError && <p className="text-[11px] text-[#B91C1C]" role="alert">{validationError}</p>}
    </div>
  );
};

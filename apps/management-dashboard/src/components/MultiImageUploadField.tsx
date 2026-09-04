import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import type { AttachmentRecord } from '../../../../packages/api/src/uploadClient';

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,image/jpeg,image/png';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 4;
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

const formatFileSize = (bytes: number) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

type Props = {
  label: string;
  files: File[];
  existingAttachments: AttachmentRecord[];
  existingPreviewUrls: Record<string, string>;
  onFilesChange: (files: File[]) => void;
  onRemoveExisting: (attachment: AttachmentRecord) => Promise<void>;
  disabled?: boolean;
};

export const MultiImageUploadField = ({
  label,
  files,
  existingAttachments,
  existingPreviewUrls,
  onFilesChange,
  onRemoveExisting,
  disabled = false,
}: Props) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const localPreviews = useMemo(() => files.map(file => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => localPreviews.forEach(item => URL.revokeObjectURL(item.url)), [localPreviews]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.currentTarget.value = '';
    if (selected.length === 0) return;
    if (existingAttachments.length + files.length + selected.length > MAX_IMAGES) {
      setValidationError('Maximum 4 images can be attached.');
      return;
    }
    const invalid = selected.map(validateImageFile).find(Boolean);
    if (invalid) {
      setValidationError(invalid);
      return;
    }
    setValidationError(null);
    onFilesChange([...files, ...selected]);
  };

  const removeExisting = async (attachment: AttachmentRecord) => {
    setRemovingId(attachment.id);
    setValidationError(null);
    try {
      await onRemoveExisting(attachment);
    } catch (error: any) {
      setValidationError(error?.response?.data?.message || 'Unable to remove the existing image.');
    } finally {
      setRemovingId(null);
    }
  };

  const total = existingAttachments.length + files.length;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {existingAttachments.map((attachment, index) => (
          <div key={attachment.id} className="flex items-center gap-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white text-[#9CA3AF]">
              {existingPreviewUrls[attachment.id]
                ? <img src={existingPreviewUrls[attachment.id]} alt={`${label} ${index + 1}`} className="h-full w-full object-contain" />
                : <ImageIcon className="h-6 w-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-medium text-[#1A1818]">{attachment.originalName || `Image ${index + 1}`}</p>
              <p className="mt-1 text-[11px] text-[#9CA3AF]">{attachment.sizeBytes ? formatFileSize(Number(attachment.sizeBytes)) : 'Existing image'}</p>
            </div>
            <button type="button" disabled={disabled || removingId === attachment.id} onClick={() => void removeExisting(attachment)} aria-label={`Remove ${attachment.originalName || `image ${index + 1}`}`} className="inline-flex h-7 w-7 items-center justify-center rounded text-[#6B7280] hover:bg-[#FEE2E2] hover:text-[#CB0017] disabled:opacity-40"><X className="h-4 w-4" /></button>
          </div>
        ))}
        {localPreviews.map(({ file, url }, index) => (
          <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white"><img src={url} alt={`${label} new image ${index + 1}`} className="h-full w-full object-contain" /></div>
            <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-medium text-[#1A1818]">{file.name}</p><p className="mt-1 text-[11px] text-[#9CA3AF]">{formatFileSize(file.size)} &middot; New image</p></div>
            <button type="button" disabled={disabled} onClick={() => onFilesChange(files.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`} className="inline-flex h-7 w-7 items-center justify-center rounded text-[#6B7280] hover:bg-[#FEE2E2] hover:text-[#CB0017]"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      {total === 0 && <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-[#D6D6D6] bg-[#FAFAFA] text-[12px] text-[#94A3B8]"><ImageIcon className="mr-2 h-5 w-5" />No images selected</div>}
      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          onClick={(event) => {
            if (total < MAX_IMAGES) return;
            event.preventDefault();
            setValidationError('Maximum 4 images can be attached.');
          }}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 py-2 text-[12px] font-semibold text-[#475569] hover:bg-[#F8FAFC] ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        >
          <Upload className="h-3.5 w-3.5" />Add images
        </label>
        <span className="text-[11px] text-[#94A3B8]">{total}/4 &middot; JPG, JPEG or PNG &middot; Maximum 10 MB each</span>
      </div>
      <input ref={inputRef} id={inputId} type="file" multiple accept={IMAGE_ACCEPT} className="sr-only" onChange={handleFileChange} disabled={disabled} />
      {validationError && <p className="text-[11px] text-[#B91C1C]" role="alert">{validationError}</p>}
    </div>
  );
};

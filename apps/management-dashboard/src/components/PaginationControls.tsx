import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

const paginationItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'ellipsis-end', totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis-start', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages];
};

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  itemLabel?: string;
  className?: string;
}

export const PaginationControls = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  disabled = false,
  itemLabel = 'records',
  className = '',
}: PaginationControlsProps) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);
  const startRecord = totalRecords === 0 ? 0 : ((safeCurrentPage - 1) * pageSize) + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalRecords);
  const atStart = safeCurrentPage === 1;
  const atEnd = safeCurrentPage === safeTotalPages;
  const buttonClass = 'inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CB0017]/35 disabled:cursor-not-allowed disabled:opacity-40';
  const inactiveClass = 'border-[#E2E5E9] bg-white text-[#374151] hover:border-[#CB0017]/50 hover:bg-[#FFF7F8]';

  return (
    <div className={`flex flex-col gap-3 border-t border-[#F0F0F0] bg-[#FAFAFA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-xs text-[#6B7280]" aria-live="polite">
        Showing <span className="font-semibold text-[#374151]">{startRecord}-{endRecord}</span> of{' '}
        <span className="font-semibold text-[#374151]">{totalRecords}</span> {itemLabel}
        <span className="mx-2 hidden text-[#D1D5DB] sm:inline">|</span>
        <span className="block sm:inline">Page {safeCurrentPage} of {safeTotalPages}</span>
      </p>
      <nav aria-label="Pagination" className="flex max-w-full items-center gap-1 overflow-x-auto pb-0.5">
        <button type="button" aria-label="First page" title="First page" onClick={() => onPageChange(1)} disabled={disabled || atStart} className={`${buttonClass} ${inactiveClass}`}>
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Previous page" title="Previous page" onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))} disabled={disabled || atStart} className={`${buttonClass} ${inactiveClass}`}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        {paginationItems(safeCurrentPage, safeTotalPages).map(item => item === 'ellipsis-start' || item === 'ellipsis-end' ? (
          <span key={item} aria-hidden="true" className="px-1 text-sm text-[#9CA3AF]">…</span>
        ) : (
          <button type="button" key={item} aria-label={`Page ${item}`} aria-current={item === safeCurrentPage ? 'page' : undefined} onClick={() => onPageChange(item)} disabled={disabled} className={`${buttonClass} ${item === safeCurrentPage ? 'border-[#CB0017] bg-[#CB0017] text-white shadow-sm' : inactiveClass}`}>
            {item}
          </button>
        ))}
        <button type="button" aria-label="Next page" title="Next page" onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))} disabled={disabled || atEnd} className={`${buttonClass} ${inactiveClass}`}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Last page" title="Last page" onClick={() => onPageChange(safeTotalPages)} disabled={disabled || atEnd} className={`${buttonClass} ${inactiveClass}`}>
          <ChevronsRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
};

export default PaginationControls;

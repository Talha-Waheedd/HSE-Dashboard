import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, MapPin, Search, X } from 'lucide-react';
import { apiClient } from '@cbl/api';

type LocationOption = { id: string; name: string; code?: string | null };

interface LocationComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  label: string;
}

const PAGE_SIZE = 25;

export const LocationCombobox = ({
  value = '', onChange, required, disabled, name = 'location', label,
}: LocationComboboxProps) => {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    let current = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await apiClient.get('/locations', {
          params: { q: query, isActive: true, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
        });
        if (!current) return;
        setOptions(Array.isArray(response.data?.data) ? response.data.data : []);
        setTotal(Number(response.data?.meta?.total ?? 0));
        setActiveIndex(-1);
      } catch (error) {
        if (current) {
          setErrorMessage('Locations could not be loaded. Please try again.');
        }
        console.error('Locations could not be loaded:', error);
      } finally {
        if (current) setLoading(false);
      }
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [open, page, query, refreshToken]);

  useEffect(() => {
    const refresh = () => setRefreshToken(token => token + 1);
    window.addEventListener('locations-refresh', refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => {
      window.removeEventListener('locations-refresh', refresh);
      window.clearInterval(interval);
    };
  }, []);

  const select = (location: LocationOption) => {
    onChange(location.name);
    setQuery(location.name);
    setOpen(false);
    inputRef.current?.focus();
  };

  const close = () => window.setTimeout(() => setOpen(false), 120);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          ref={inputRef}
          name={name}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          value={open ? query : value}
          required={required}
          disabled={disabled}
          placeholder="Search locations by name or code..."
          autoComplete="off"
          className="w-full min-h-9 rounded-md border border-[#DEDEDE] bg-white py-2 pl-9 pr-16 text-[13px] text-[#1A1818] focus:border-[#CB0017] focus:outline-none focus:ring-2 focus:ring-[#CB0017]/15 disabled:cursor-not-allowed disabled:bg-[#F5F5F5] disabled:text-[#9CA3AF]"
          onFocus={() => { setOpen(true); setPage(0); }}
          onBlur={close}
          onChange={event => { setQuery(event.target.value); setPage(0); setOpen(true); }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActiveIndex(index => Math.min(index + 1, options.length - 1)); }
            if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)); }
            if (event.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) { event.preventDefault(); select(options[activeIndex]); }
            if (event.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
          }}
        />
        {loading ? <Loader2 className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#9CA3AF]" /> : <Search className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />}
        {value && !disabled && (
          <button type="button" aria-label="Clear selected location" title="Clear location" onMouseDown={event => event.preventDefault()} onClick={() => { onChange(''); setQuery(''); setPage(0); inputRef.current?.focus(); setOpen(true); }} className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#CB0017]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && !disabled && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-md border border-[#E1E4E8] bg-white shadow-lg">
          <ul id={listboxId} role="listbox" aria-label={`${label} search results`} className="max-h-60 overflow-y-auto py-1">
            {loading && options.length === 0 ? <li className="px-3 py-3 text-[13px] text-[#6B7280]">Loading locations…</li> : null}
            {!loading && errorMessage ? <li className="flex items-center justify-between gap-2 px-3 py-3 text-[13px] text-[#B42318]"><span>{errorMessage}</span><button type="button" onMouseDown={event => event.preventDefault()} onClick={() => setRefreshToken(token => token + 1)} className="rounded border border-[#F1C5C9] px-2 py-1 text-[11px] font-semibold text-[#CB0017] hover:bg-[#FFF5F6]">Retry</button></li> : null}
            {!loading && !errorMessage && options.length === 0 ? <li className="px-3 py-3 text-[13px] text-[#6B7280]">No locations found</li> : null}
            {options.map((location, index) => (
              <li key={location.id} id={`${listboxId}-option-${index}`} role="option" aria-selected={location.name === value} onMouseDown={event => event.preventDefault()} onClick={() => select(location)} className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[13px] ${index === activeIndex ? 'bg-[#FFF1F3]' : 'hover:bg-[#F9FAFB]'}`}>
                <span className="min-w-0"><span className="block truncate font-medium text-[#1A1818]">{location.name}</span>{location.code && <span className="block truncate text-[11px] text-[#6B7280]">{location.code}</span>}</span>
                {location.name === value && <Check className="h-4 w-4 shrink-0 text-[#CB0017]" />}
              </li>
            ))}
            {!loading && !errorMessage && (
              <li key="other" role="option" aria-selected={'Other' === value} onMouseDown={event => event.preventDefault()} onClick={() => select({ id: 'other', name: 'Other' })} className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-[13px] hover:bg-[#F9FAFB] border-t border-[#F0F0F0]`}>
                <span className="min-w-0"><span className="block truncate font-medium text-[#1A1818]">Other</span></span>
                {'Other' === value && <Check className="h-4 w-4 shrink-0 text-[#CB0017]" />}
              </li>
            )}
          </ul>
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-[#F0F0F0] bg-[#FAFAFA] px-2 py-1.5 text-[11px] text-[#6B7280]">
              <span>Page {page + 1} of {totalPages} · {total} locations</span>
              <span className="flex gap-1"><button type="button" aria-label="Previous locations page" disabled={page === 0} onMouseDown={event => event.preventDefault()} onClick={() => setPage(current => Math.max(0, current - 1))} className="rounded p-1 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button><button type="button" aria-label="Next locations page" disabled={page + 1 >= totalPages} onMouseDown={event => event.preventDefault()} onClick={() => setPage(current => Math.min(totalPages - 1, current + 1))} className="rounded p-1 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

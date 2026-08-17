const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/;

/** Formats a calendar date without converting it through the browser timezone. */
export const formatDateOnly = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  const text = String(value).trim();
  const match = text.match(DATE_ONLY_PATTERN);
  if (!match) return '—';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
};

/** Formats an actual timestamp in the user's local timezone. */
export const formatDateTimeLocal = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
};

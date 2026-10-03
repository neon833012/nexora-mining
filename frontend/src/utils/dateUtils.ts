/**
 * Safely parses any date string (including SQLite "YYYY-MM-DD HH:MM:SS" without Z) as UTC milliseconds
 */
export const parseUtcMs = (dateInput?: string | number | Date | null): number => {
  if (!dateInput) return 0;
  if (typeof dateInput === 'number') return dateInput;
  if (dateInput instanceof Date) return dateInput.getTime();
  const s = String(dateInput).trim();
  if (!s) return 0;
  if (!isNaN(Number(s))) return Number(s);
  if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) {
    return new Date(s).getTime();
  }
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s)) {
    return new Date(s.replace(' ', 'T') + 'Z').getTime();
  }
  return new Date(s).getTime();
};

/**
 * Formats any date input into USA Eastern Time (America/New_York) format
 */
export const formatUsaDateTime = (dateInput?: string | number | Date | null): string => {
  if (!dateInput) return 'Recently';
  try {
    const ms = parseUtcMs(dateInput);
    if (!ms || isNaN(ms)) return String(dateInput);
    const d = new Date(ms);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d) + ' EDT';
  } catch {
    return String(dateInput);
  }
};

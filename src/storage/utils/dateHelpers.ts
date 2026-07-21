// Date utility functions for timestamp handling

/** Parse YYYY-MM-DD from a date input as a local calendar date (noon avoids DST edge cases). */
export function parseLocalDateString(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
}

/** Format a timestamp as YYYY-MM-DD in local time (for date inputs). */
export function toLocalDateInputValue(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayLocalDateInputValue(): string {
  return toLocalDateInputValue(Date.now());
}

/** Whole-day difference between two YYYY-MM-DD strings in local time. */
export function daysBetweenLocalDateStrings(start: string, end: string): number {
  const ms = parseLocalDateString(end) - parseLocalDateString(start);
  return Math.round(ms / 86400000);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return formatDate(timestamp);
}

export function getDaysSince(timestamp: number): number {
  const now = Date.now();
  return Math.floor((now - timestamp) / 86400000);
}

export function addDays(timestamp: number, days: number): number {
  return timestamp + days * 86400000;
}

export function getDaysUntil(timestamp: number): number {
  const now = Date.now();
  return Math.ceil((timestamp - now) / 86400000);
}

export function isSameDay(timestamp1: number, timestamp2: number): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

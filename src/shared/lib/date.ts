import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * The single date-handling entry point for the app. Every display date is
 * formatted in UTC — never the viewer's local browser timezone — so the
 * same order/review/post shows the same date to everyone, and admin
 * dashboards never need to reason about timezone offsets. Any future
 * background job should read/write timestamps through this module too
 * (dayjs.utc()) rather than relying on native Date + implicit local time.
 */

export type DateInput = Date | string | number;

/** Current moment, UTC. Use instead of `new Date()` / `Date.now()` for consistency. */
export function utcNow() {
  return dayjs.utc();
}

/** "Aug 14, 2026" */
export function formatDate(date: DateInput): string {
  return dayjs.utc(date).format('MMM D, YYYY');
}

/** "Aug 14, 2026, 3:45 PM" */
export function formatDateTime(date: DateInput): string {
  return dayjs.utc(date).format('MMM D, YYYY, h:mm A');
}

/** "3:45 PM" */
export function formatTime(date: DateInput): string {
  return dayjs.utc(date).format('h:mm A');
}

/** ISO date only, e.g. "2026-08-14" — for <input type="date"> values. */
export function toDateInputValue(date: DateInput): string {
  return dayjs.utc(date).format('YYYY-MM-DD');
}

/** "Aug '26" — for compact chart axis labels. */
export function formatMonthYear(date: DateInput): string {
  return dayjs.utc(date).format("MMM 'YY");
}

/** "2026-08" — a UTC year-month bucket key, stable regardless of viewer timezone. */
export function monthKey(date: DateInput): string {
  return dayjs.utc(date).format('YYYY-MM');
}

export { dayjs };

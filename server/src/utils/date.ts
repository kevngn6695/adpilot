import env from '../config/env.js';

const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: env.APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Today's date ('YYYY-MM-DD') in the business's time zone. Reports cut over at
 * local midnight, not UTC midnight — otherwise a 7 PM visit in California would
 * already show tomorrow.
 */
export function today(): string {
  return formatter.format(new Date());
}

/** The same day as a UTC-midnight Date, for date arithmetic. */
export function todayAsDate(): Date {
  return new Date(`${today()}T00:00:00Z`);
}

export function daysAgo(n: number): string {
  const date = todayAsDate();
  date.setUTCDate(date.getUTCDate() - n);
  return date.toISOString().slice(0, 10);
}

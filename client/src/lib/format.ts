import type { Metric } from '@shared/types';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const whole = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export const formatMoney = (cents: number): string => usd.format(cents / 100);
export const formatMoneyWhole = (cents: number): string => usdWhole.format(cents / 100);
export const formatNumber = (value: number): string => whole.format(value);
export const formatCompact = (value: number): string => compact.format(value);
export const formatPercent = (ratio: number): string => percent.format(ratio);

/** 'YYYY-MM-DD' → 'Oct 7', read as UTC so the day never shifts. */
export const formatDay = (isoDay: string): string => shortDate.format(new Date(`${isoDay}T00:00:00Z`));

/** Safe ratio: returns null instead of NaN/Infinity when the denominator is 0. */
export const ratio = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null);

export const METRIC_LABELS: Record<Metric, string> = {
  spend: 'Spend',
  impressions: 'Impressions',
  clicks: 'Clicks',
  conversions: 'Conversions',
};

/** Formats a chart value for its metric (spend arrives in cents). */
export function formatMetric(metric: Metric, value: number, { short = false } = {}): string {
  if (metric === 'spend') return short ? formatMoneyWhole(value) : formatMoney(value);
  return short ? formatCompact(value) : formatNumber(value);
}

export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

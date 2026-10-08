import type { Objective } from '../../../shared/types.js';

/**
 * Generates realistic-looking daily ad metrics for demo campaigns.
 *
 * This is a portfolio app with no real ad network behind it, so every number
 * the dashboard shows is simulated here. It is deterministic (seeded), so the
 * same campaign always gets the same history.
 */

export interface SimulatedDay {
  day: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spendCents: number;
}

/** Small seeded PRNG (mulberry32) so results are repeatable. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

// How each objective tends to perform: cost per 1,000 views, click rate, conversion rate.
const PROFILES: Record<Objective, { cpm: number; ctr: number; cvr: number }> = {
  awareness: { cpm: 4.2, ctr: 0.007, cvr: 0.012 },
  traffic: { cpm: 7.5, ctr: 0.016, cvr: 0.025 },
  conversions: { cpm: 11, ctr: 0.013, cvr: 0.06 },
};

export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function simulateHistory(options: {
  seed: number;
  objective: Objective;
  dailyBudgetCents: number;
  days: number;
  endDate?: Date;
}): SimulatedDay[] {
  const { seed, objective, dailyBudgetCents, days } = options;
  const end = options.endDate ?? new Date();
  const random = seededRandom(seed);
  const profile = PROFILES[objective];
  const result: SimulatedDay[] = [];

  // A slow trend per campaign: some improve over the window, some fade.
  const trend = (random() - 0.4) * 0.5;

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i));
    const progress = (days - 1 - i) / Math.max(days - 1, 1);
    const weekday = date.getUTCDay();
    const weekendLift = weekday === 0 || weekday === 6 ? 1.12 : 1;
    const noise = 0.85 + random() * 0.3;

    // Spend runs close to budget; delivery varies day to day.
    const spendCents = Math.round(dailyBudgetCents * (0.82 + random() * 0.18));
    const cpm = profile.cpm * (0.9 + random() * 0.2);
    const impressions = Math.round(((spendCents / 100) / cpm) * 1000 * weekendLift);
    const ctr = profile.ctr * (1 + trend * progress) * noise;
    const clicks = Math.round(impressions * ctr);
    const conversions = Math.round(clicks * profile.cvr * (0.8 + random() * 0.4));

    result.push({ day: isoDay(date), impressions, clicks, conversions, spendCents });
  }

  return result;
}

import { describe, expect, it } from 'vitest';
import { parseVariants, templateCopy, LIMITS } from '../services/copy.service.js';
import { seededRandom, simulateHistory } from '../services/simulate.js';
import { newCampaignSchema } from '../routes/schemas.js';

describe('simulateHistory', () => {
  const options = { seed: 42, objective: 'traffic' as const, dailyBudgetCents: 3_000, days: 14 };

  it('returns one row per day, oldest first, ending today', () => {
    const end = new Date(Date.UTC(2026, 9, 7));
    const history = simulateHistory({ ...options, endDate: end });
    expect(history).toHaveLength(14);
    expect(history[0]?.day).toBe('2026-09-24');
    expect(history.at(-1)?.day).toBe('2026-10-07');
  });

  it('is deterministic for the same seed', () => {
    const end = new Date(Date.UTC(2026, 9, 7));
    expect(simulateHistory({ ...options, endDate: end })).toEqual(
      simulateHistory({ ...options, endDate: end })
    );
  });

  it('keeps the funnel consistent and spend within budget', () => {
    for (const day of simulateHistory(options)) {
      expect(day.clicks).toBeLessThanOrEqual(day.impressions);
      expect(day.conversions).toBeLessThanOrEqual(day.clicks);
      expect(day.spendCents).toBeLessThanOrEqual(options.dailyBudgetCents);
      expect(day.spendCents).toBeGreaterThan(0);
    }
  });

  it('seededRandom stays in [0, 1)', () => {
    const random = seededRandom(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('ad copy', () => {
  const request = {
    product: 'Pumpkin cold brew',
    audience: 'college students',
    objective: 'traffic' as const,
    tone: 'playful' as const,
  };

  it('templates return three variants within platform limits', () => {
    const variants = templateCopy(request);
    expect(variants).toHaveLength(3);
    for (const v of variants) {
      expect(v.headline.length).toBeLessThanOrEqual(LIMITS.headline);
      expect(v.body.length).toBeLessThanOrEqual(LIMITS.body);
      expect(v.cta.length).toBeLessThanOrEqual(LIMITS.cta);
    }
  });

  it('parses JSON even when the model wraps it in prose', () => {
    const reply = 'Here you go:\n{"variants":[{"headline":"Hi","body":"Body","cta":"Go"}]}\nEnjoy!';
    expect(parseVariants(reply)).toEqual([{ headline: 'Hi', body: 'Body', cta: 'Go' }]);
  });

  it('rejects malformed replies and trims over-long fields', () => {
    expect(parseVariants('no json here')).toBeNull();
    expect(parseVariants('{"variants": "nope"}')).toBeNull();
    const long = 'x'.repeat(200);
    const parsed = parseVariants(JSON.stringify({ variants: [{ headline: long, body: long, cta: long }] }));
    expect(parsed?.[0]?.headline.length).toBe(LIMITS.headline);
  });
});

describe('newCampaignSchema', () => {
  const valid = {
    name: 'Test',
    objective: 'awareness',
    dailyBudgetCents: 2_000,
    startDate: '2026-10-07',
    audience: { locations: ['San Jose, CA'], ageMin: 18, ageMax: 30, interests: [] },
    creative: { headline: 'Hello', body: 'World', cta: 'Go' },
  };

  it('accepts a valid campaign', () => {
    expect(newCampaignSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an inverted age range and a tiny budget with field paths', () => {
    const result = newCampaignSchema.safeParse({
      ...valid,
      dailyBudgetCents: 100,
      audience: { ...valid.audience, ageMin: 40, ageMax: 20 },
    });
    expect(result.success).toBe(false);
    const paths = result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('dailyBudgetCents');
    expect(paths).toContain('audience.ageMin');
  });
});

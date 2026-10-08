import { query } from './pool.js';
import { createCampaign } from '../services/campaigns.service.js';
import { daysAgo } from '../utils/date.js';
import type { NewCampaign } from '../../../shared/types.js';

/**
 * Demo data for a fictional neighborhood coffee shop, so a fresh install has a
 * dashboard worth looking at. Fixed seeds keep the numbers the same every time.
 */
const DEMO: { campaign: NewCampaign; seed: number }[] = [
  {
    seed: 11,
    campaign: {
      name: 'Fall menu launch',
      objective: 'awareness',
      dailyBudgetCents: 4_000,
      startDate: daysAgo(30),
      audience: { locations: ['San Jose, CA'], ageMin: 21, ageMax: 45, interests: ['Coffee', 'Local food'] },
      creative: {
        headline: 'Pumpkin cold brew is back',
        body: 'Our fall menu just landed: pumpkin cold brew, maple lattes, and fresh apple scones.',
        cta: 'See the menu',
      },
    },
  },
  {
    seed: 23,
    campaign: {
      name: 'Weekend brunch promo',
      objective: 'traffic',
      dailyBudgetCents: 2_500,
      startDate: daysAgo(30),
      audience: { locations: ['San Jose, CA', 'Santa Clara, CA'], ageMin: 25, ageMax: 54, interests: ['Brunch', 'Weekend plans'] },
      creative: {
        headline: 'Brunch, minus the wait',
        body: 'Reserve a table online and skip the line this weekend. Bottomless drip coffee included.',
        cta: 'Book a table',
      },
    },
  },
  {
    seed: 37,
    campaign: {
      name: 'Loyalty app sign-ups',
      objective: 'conversions',
      dailyBudgetCents: 5_500,
      startDate: daysAgo(30),
      audience: { locations: ['San Jose, CA'], ageMin: 18, ageMax: 40, interests: ['Coffee', 'Rewards apps'] },
      creative: {
        headline: 'Your 10th coffee is on us',
        body: 'Join our free rewards app and earn a free drink every ten visits. Takes 30 seconds.',
        cta: 'Join free',
      },
    },
  },
  {
    seed: 51,
    campaign: {
      name: 'Holiday gift cards',
      objective: 'conversions',
      dailyBudgetCents: 3_000,
      startDate: daysAgo(30),
      audience: { locations: ['Bay Area, CA'], ageMin: 25, ageMax: 65, interests: ['Gift ideas', 'Shopping'] },
      creative: {
        headline: 'The gift every coffee lover wants',
        body: 'Digital gift cards, delivered by email in seconds. Any amount, never expires.',
        cta: 'Buy a gift card',
      },
    },
  },
];

export async function seed(): Promise<number> {
  const { rows } = await query<{ count: number }>('SELECT COUNT(*)::int AS count FROM campaigns');
  if ((rows[0]?.count ?? 0) > 0) return 0;

  // Insert oldest first so the newest demo campaign sorts to the top.
  for (const { campaign, seed: s } of [...DEMO].reverse()) {
    await createCampaign(campaign, s);
  }
  return DEMO.length;
}

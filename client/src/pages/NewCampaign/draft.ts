import type { AdCreative, NewCampaign, Objective, Tone } from '@shared/types';
import { todayIso } from '@/lib/format';

/** Everything the wizard collects, kept as form-friendly values (budget as a dollar string). */
export interface Draft {
  name: string;
  objective: Objective | '';
  startDate: string;
  locations: string[];
  ageMin: string;
  ageMax: string;
  interests: string[];
  product: string;
  audienceDescription: string;
  tone: Tone;
  creative: AdCreative;
  dailyBudget: string;
}

export type Errors = Partial<Record<string, string>>;

export const STEPS = ['Basics', 'Audience', 'Ad copy', 'Budget and launch'] as const;

// Same limits the API enforces.
export const LIMITS = { headline: 40, body: 125, cta: 20 } as const;

export function emptyDraft(): Draft {
  return {
    name: '',
    objective: '',
    startDate: todayIso(),
    locations: [],
    ageMin: '18',
    ageMax: '45',
    interests: [],
    product: '',
    audienceDescription: '',
    tone: 'friendly',
    creative: { headline: '', body: '', cta: '' },
    dailyBudget: '25',
  };
}

const toInt = (value: string) => (value.trim() === '' ? NaN : Number(value));

/** Checks one step; returns field errors keyed like the API's issue paths. */
export function validateStep(step: number, d: Draft): Errors {
  const e: Errors = {};

  if (step === 0) {
    if (!d.name.trim()) e.name = 'Give the campaign a name.';
    else if (d.name.trim().length > 80) e.name = 'Keep the name to 80 characters or fewer.';
    if (!d.objective) e.objective = 'Choose what this campaign should achieve.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.startDate)) e.startDate = 'Pick a start date.';
  }

  if (step === 1) {
    if (d.locations.length === 0) e['audience.locations'] = 'Add at least one location.';
    const min = toInt(d.ageMin);
    const max = toInt(d.ageMax);
    if (!Number.isInteger(min) || min < 13 || min > 65) e['audience.ageMin'] = 'Enter an age from 13 to 65.';
    if (!Number.isInteger(max) || max < 13 || max > 65) e['audience.ageMax'] = 'Enter an age from 13 to 65.';
    if (!e['audience.ageMin'] && !e['audience.ageMax'] && min > max) {
      e['audience.ageMin'] = 'Minimum age must be at or below maximum age.';
    }
  }

  if (step === 2) {
    const { headline, body, cta } = d.creative;
    if (!headline.trim()) e['creative.headline'] = 'Add a headline, or generate one.';
    else if (headline.length > LIMITS.headline) e['creative.headline'] = `Shorten the headline to ${LIMITS.headline} characters.`;
    if (!body.trim()) e['creative.body'] = 'Add ad text, or generate it.';
    else if (body.length > LIMITS.body) e['creative.body'] = `Shorten the ad text to ${LIMITS.body} characters.`;
    if (!cta.trim()) e['creative.cta'] = 'Add button text.';
    else if (cta.length > LIMITS.cta) e['creative.cta'] = `Shorten the button text to ${LIMITS.cta} characters.`;
  }

  if (step === 3) {
    const dollars = Number(d.dailyBudget);
    if (!Number.isFinite(dollars) || d.dailyBudget.trim() === '') e.dailyBudgetCents = 'Enter a daily budget.';
    else if (dollars < 5) e.dailyBudgetCents = 'Daily budget must be at least $5.';
    else if (dollars > 100_000) e.dailyBudgetCents = 'Daily budget must be $100,000 or less.';
  }

  return e;
}

/** Which step owns a field, so server-side errors send the user back to the right place. */
export function stepForField(field: string): number {
  if (field.startsWith('audience')) return 1;
  if (field.startsWith('creative')) return 2;
  if (field === 'dailyBudgetCents') return 3;
  return 0;
}

export function toNewCampaign(d: Draft): NewCampaign {
  return {
    name: d.name.trim(),
    objective: d.objective as Objective,
    startDate: d.startDate,
    dailyBudgetCents: Math.round(Number(d.dailyBudget) * 100),
    audience: {
      locations: d.locations,
      ageMin: Number(d.ageMin),
      ageMax: Number(d.ageMax),
      interests: d.interests,
    },
    creative: {
      headline: d.creative.headline.trim(),
      body: d.creative.body.trim(),
      cta: d.creative.cta.trim(),
    },
  };
}

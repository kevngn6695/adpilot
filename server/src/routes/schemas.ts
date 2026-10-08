import { z } from 'zod';
import { METRICS, OBJECTIVES, RANGES, STATUSES, TONES } from '../../../shared/types.js';
import { LIMITS } from '../services/copy.service.js';

const text = (label: string, max: number) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const audienceSchema = z
  .object({
    locations: z.array(text('Location', 60)).min(1, 'Add at least one location').max(10),
    ageMin: z.number().int().min(13, 'Minimum age is 13').max(65),
    ageMax: z.number().int().min(13).max(65, 'Maximum age is 65'),
    interests: z.array(text('Interest', 40)).max(15, 'Up to 15 interests'),
  })
  .refine((a) => a.ageMin <= a.ageMax, {
    message: 'Minimum age must be at or below maximum age',
    path: ['ageMin'],
  });

export const creativeSchema = z.object({
  headline: text('Headline', LIMITS.headline),
  body: text('Ad text', LIMITS.body),
  cta: text('Button text', LIMITS.cta),
});

export const newCampaignSchema = z.object({
  name: text('Campaign name', 80),
  objective: z.enum(OBJECTIVES, { message: 'Choose an objective' }),
  dailyBudgetCents: z
    .number()
    .int()
    .min(500, 'Daily budget must be at least $5')
    .max(10_000_000, 'Daily budget must be $100,000 or less'),
  audience: audienceSchema,
  creative: creativeSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
});

export const statusSchema = z.object({ status: z.enum(STATUSES) });

export const copyRequestSchema = z.object({
  product: text('Product or offer', 80),
  audience: text('Audience', 80),
  objective: z.enum(OBJECTIVES),
  tone: z.enum(TONES),
});

const rangeValues = RANGES.map(String) as [string, ...string[]];

export const rangeQuerySchema = z.object({
  days: z
    .enum(rangeValues)
    .default('30')
    .transform((value) => Number(value)),
});

export const seriesQuerySchema = rangeQuerySchema.extend({
  metric: z.enum(METRICS).default('spend'),
});

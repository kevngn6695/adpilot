/**
 * Types shared by the API and the web client, so both sides agree on the
 * shape of every request and response.
 */

export const OBJECTIVES = ['awareness', 'traffic', 'conversions'] as const;
export type Objective = (typeof OBJECTIVES)[number];

export const STATUSES = ['active', 'paused'] as const;
export type CampaignStatus = (typeof STATUSES)[number];

export const TONES = ['friendly', 'bold', 'premium', 'playful'] as const;
export type Tone = (typeof TONES)[number];

export const METRICS = ['spend', 'impressions', 'clicks', 'conversions'] as const;
export type Metric = (typeof METRICS)[number];

export const RANGES = [7, 14, 30] as const;
export type RangeDays = (typeof RANGES)[number];

export interface Audience {
  locations: string[];
  ageMin: number;
  ageMax: number;
  interests: string[];
}

export interface AdCreative {
  headline: string;
  body: string;
  cta: string;
}

export interface Totals {
  impressions: number;
  clicks: number;
  conversions: number;
  spendCents: number;
}

export interface Campaign {
  id: number;
  name: string;
  objective: Objective;
  status: CampaignStatus;
  dailyBudgetCents: number;
  audience: Audience;
  creative: AdCreative;
  startDate: string;
  createdAt: string;
}

export interface CampaignWithTotals extends Campaign {
  totals: Totals;
}

export interface NewCampaign {
  name: string;
  objective: Objective;
  dailyBudgetCents: number;
  audience: Audience;
  creative: AdCreative;
  startDate: string;
}

export interface DailyPoint {
  day: string;
  value: number;
}

export interface MetricSeries {
  campaignId: number | null;
  name: string;
  points: DailyPoint[];
}

export interface CopyRequest {
  product: string;
  audience: string;
  objective: Objective;
  tone: Tone;
}

export interface CopyResponse {
  variants: AdCreative[];
  source: 'llm' | 'template';
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: string;
  issues?: Record<string, string>;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

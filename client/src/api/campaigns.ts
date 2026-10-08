import type {
  Campaign,
  CampaignStatus,
  CampaignWithTotals,
  CopyRequest,
  CopyResponse,
  Metric,
  MetricSeries,
  NewCampaign,
  RangeDays,
} from '@shared/types';
import { apiFetch } from './client';

export const campaignsApi = {
  list: (days: RangeDays, signal?: AbortSignal) =>
    apiFetch<CampaignWithTotals[]>(`/campaigns?days=${days}`, { signal }),

  series: (days: RangeDays, metric: Metric, signal?: AbortSignal) =>
    apiFetch<MetricSeries[]>(`/campaigns/series?days=${days}&metric=${metric}`, { signal }),

  create: (campaign: NewCampaign) =>
    apiFetch<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(campaign) }),

  setStatus: (id: number, status: CampaignStatus) =>
    apiFetch<Campaign>(`/campaigns/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  remove: (id: number) => apiFetch<void>(`/campaigns/${id}`, { method: 'DELETE' }),
};

export const copyApi = {
  generate: (request: CopyRequest) =>
    apiFetch<CopyResponse>('/copy/generate', { method: 'POST', body: JSON.stringify(request) }),
};

import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CampaignStatus, Metric, RangeDays } from '@shared/types';
import { campaignsApi } from '@/api/campaigns';
import { useQuery } from '@/hooks/useQuery';
import Button, { ButtonLink } from '@/components/Button';
import SegmentedControl from '@/components/SegmentedControl';
import KpiStrip from '@/components/KpiStrip';
import type { Kpi } from '@/components/KpiStrip';
import MetricChart from '@/components/MetricChart';
import CampaignTable from '@/components/CampaignTable';
import {
  formatMoney,
  formatNumber,
  formatPercent,
  METRIC_LABELS,
  ratio,
} from '@/lib/format';
import './Dashboard.scss';

const RANGE_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
] as const;

const METRIC_OPTIONS = (Object.keys(METRIC_LABELS) as Metric[]).map((value) => ({
  value,
  label: METRIC_LABELS[value],
}));

const MAX_CHART_SERIES = 4;

export default function DashboardPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const [metric, setMetric] = useState<Metric>('spend');
  const [actionError, setActionError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const created = (location.state as { created?: string } | null)?.created;

  const campaigns = useQuery(`campaigns:${days}`, (signal) => campaignsApi.list(days, signal));
  const series = useQuery(`series:${days}:${metric}`, (signal) => campaignsApi.series(days, metric, signal));

  const totals = useMemo(() => {
    const sum = { spendCents: 0, impressions: 0, clicks: 0, conversions: 0 };
    for (const c of campaigns.data ?? []) {
      sum.spendCents += c.totals.spendCents;
      sum.impressions += c.totals.impressions;
      sum.clicks += c.totals.clicks;
      sum.conversions += c.totals.conversions;
    }
    return sum;
  }, [campaigns.data]);

  const kpis: Kpi[] = useMemo(() => {
    const ctr = ratio(totals.clicks, totals.impressions);
    const cpa = ratio(totals.spendCents, totals.conversions);
    return [
      { label: 'Spend', value: formatMoney(totals.spendCents), detail: `Last ${days} days` },
      { label: 'Impressions', value: formatNumber(totals.impressions) },
      { label: 'Clicks', value: formatNumber(totals.clicks), detail: ctr === null ? undefined : `${formatPercent(ctr)} click rate` },
      {
        label: 'Conversions',
        value: formatNumber(totals.conversions),
        detail: cpa === null ? undefined : `${formatMoney(cpa)} each`,
      },
    ];
  }, [totals, days]);

  // The chart shows the top campaigns by spend. Picking by spend (not the chosen metric)
  // means switching metrics never swaps lines or repaints a campaign in a new color.
  const chartSeries = useMemo(() => {
    const top = [...(campaigns.data ?? [])]
      .sort((a, b) => b.totals.spendCents - a.totals.spendCents)
      .slice(0, MAX_CHART_SERIES)
      .map((c) => c.id)
      .sort((a, b) => a - b);
    return (series.data ?? [])
      .filter((s) => s.campaignId !== null && top.includes(s.campaignId))
      .sort((a, b) => (a.campaignId ?? 0) - (b.campaignId ?? 0));
  }, [campaigns.data, series.data]);

  const refreshAll = useCallback(() => {
    campaigns.refetch();
    series.refetch();
  }, [campaigns, series]);

  const handleToggle = async (id: number, next: CampaignStatus) => {
    setActionError(null);
    try {
      await campaignsApi.setStatus(id, next);
      campaigns.refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Couldn’t update the campaign.');
    }
  };

  const handleDelete = async (id: number) => {
    setActionError(null);
    try {
      await campaignsApi.remove(id);
      refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Couldn’t delete the campaign.');
    }
  };

  const error = campaigns.error ?? series.error;
  const isEmpty = campaigns.data?.length === 0;
  const hiddenCount = (campaigns.data?.length ?? 0) - chartSeries.length;

  return (
    <div className="dashboard">
      <header className="dashboard__head">
        <div>
          <h1 className="dashboard__title">Campaigns</h1>
          <p className="dashboard__subtitle">Results for a demo coffee shop. Every number here is simulated.</p>
        </div>
        <ButtonLink to="/campaigns/new">Create campaign</ButtonLink>
      </header>

      {created && (
        <div className="dashboard__notice" role="status">
          <span>“{created}” is live, with 30 days of simulated results.</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('.', { replace: true, state: null })}>
            Dismiss
          </Button>
        </div>
      )}

      {(error || actionError) && (
        <div className="dashboard__error" role="alert">
          <span>{actionError ?? error}</span>
          {error && (
            <Button variant="secondary" size="sm" onClick={refreshAll}>
              Try again
            </Button>
          )}
        </div>
      )}

      {campaigns.isLoading && !error && <p className="dashboard__loading">Loading campaigns…</p>}

      {isEmpty && (
        <section className="dashboard__empty">
          <h2 className="dashboard__empty-title">No campaigns yet</h2>
          <p>Create your first campaign and its results will show up here.</p>
          <ButtonLink to="/campaigns/new">Create campaign</ButtonLink>
        </section>
      )}

      {campaigns.data && !isEmpty && (
        <>
          <div className="dashboard__filters">
            <SegmentedControl label="Date range" options={RANGE_OPTIONS} value={days} onChange={setDays} />
          </div>

          <KpiStrip items={kpis} isDimmed={campaigns.isRefreshing} />

          <section className="dashboard__section" aria-labelledby="trend-heading">
            <div className="dashboard__section-head">
              <div>
                <h2 id="trend-heading" className="dashboard__section-title">
                  {METRIC_LABELS[metric]} per day
                </h2>
                {hiddenCount > 0 && (
                  <p className="dashboard__section-note">
                    Showing your top {MAX_CHART_SERIES} campaigns by spend. All {campaigns.data.length} are in the
                    table below.
                  </p>
                )}
              </div>
              <SegmentedControl label="Metric" options={METRIC_OPTIONS} value={metric} onChange={setMetric} />
            </div>
            {chartSeries.length > 0 && (
              <MetricChart series={chartSeries} metric={metric} isDimmed={series.isRefreshing} />
            )}
          </section>

          <section className="dashboard__section" aria-labelledby="table-heading">
            <h2 id="table-heading" className="dashboard__section-title">
              All campaigns
            </h2>
            <CampaignTable
              campaigns={campaigns.data}
              isDimmed={campaigns.isRefreshing}
              onToggleStatus={handleToggle}
              onDelete={handleDelete}
            />
          </section>
        </>
      )}
    </div>
  );
}

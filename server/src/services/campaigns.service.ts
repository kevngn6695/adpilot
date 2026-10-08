import { query, withTransaction } from '../db/pool.js';
import { simulateHistory } from './simulate.js';
import { today, todayAsDate } from '../utils/date.js';
import type {
  AdCreative,
  Audience,
  Campaign,
  CampaignStatus,
  CampaignWithTotals,
  Metric,
  MetricSeries,
  NewCampaign,
  Objective,
} from '../../../shared/types.js';

/** Days of simulated history given to every new campaign, so the dashboard has data. */
export const HISTORY_DAYS = 30;


// Whitelist: metric names map to real column names; user input never reaches SQL text.
const METRIC_COLUMNS: Record<Metric, string> = {
  spend: 'spend_cents',
  impressions: 'impressions',
  clicks: 'clicks',
  conversions: 'conversions',
};

interface CampaignRow {
  id: number;
  name: string;
  objective: Objective;
  status: CampaignStatus;
  daily_budget_cents: number;
  audience: Audience;
  creative: AdCreative;
  start_date: string;
  created_at: Date;
}

interface CampaignTotalsRow extends CampaignRow {
  impressions: number;
  clicks: number;
  conversions: number;
  spend_cents: number;
}

function toCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    objective: row.objective,
    status: row.status,
    dailyBudgetCents: row.daily_budget_cents,
    audience: row.audience,
    creative: row.creative,
    startDate: row.start_date,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listCampaigns(days: number): Promise<CampaignWithTotals[]> {
  const { rows } = await query<CampaignTotalsRow>(
    `SELECT c.*,
            COALESCE(SUM(m.impressions), 0) AS impressions,
            COALESCE(SUM(m.clicks), 0)      AS clicks,
            COALESCE(SUM(m.conversions), 0) AS conversions,
            COALESCE(SUM(m.spend_cents), 0) AS spend_cents
       FROM campaigns c
       LEFT JOIN campaign_metrics m
              ON m.campaign_id = c.id
             AND m.day > $2::date - $1::int
      GROUP BY c.id
      ORDER BY c.created_at DESC, c.id DESC`,
    [days, today()]
  );

  return rows.map((row) => ({
    ...toCampaign(row),
    totals: {
      impressions: row.impressions,
      clicks: row.clicks,
      conversions: row.conversions,
      spendCents: row.spend_cents,
    },
  }));
}

export async function getCampaign(id: number): Promise<Campaign | null> {
  const { rows } = await query<CampaignRow>('SELECT * FROM campaigns WHERE id = $1', [id]);
  return rows[0] ? toCampaign(rows[0]) : null;
}

/** Creates a campaign and its simulated history in one transaction. */
export async function createCampaign(input: NewCampaign, seed?: number): Promise<Campaign> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<CampaignRow>(
      `INSERT INTO campaigns (name, objective, daily_budget_cents, audience, creative, start_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.name,
        input.objective,
        input.dailyBudgetCents,
        JSON.stringify(input.audience),
        JSON.stringify(input.creative),
        input.startDate,
      ]
    );
    const campaign = rows[0];
    if (!campaign) throw new Error('Insert returned no row');

    const history = simulateHistory({
      seed: seed ?? campaign.id * 7919,
      objective: input.objective,
      dailyBudgetCents: input.dailyBudgetCents,
      days: HISTORY_DAYS,
      endDate: todayAsDate(),
    });

    // One multi-row insert instead of 30 round trips.
    const values: unknown[] = [];
    const tuples = history.map((day, i) => {
      const base = i * 6;
      values.push(campaign.id, day.day, day.impressions, day.clicks, day.conversions, day.spendCents);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    });
    await client.query(
      `INSERT INTO campaign_metrics (campaign_id, day, impressions, clicks, conversions, spend_cents)
       VALUES ${tuples.join(', ')}`,
      values
    );

    return toCampaign(campaign);
  });
}

export async function updateStatus(id: number, status: CampaignStatus): Promise<Campaign | null> {
  const { rows } = await query<CampaignRow>(
    'UPDATE campaigns SET status = $2 WHERE id = $1 RETURNING *',
    [id, status]
  );
  return rows[0] ? toCampaign(rows[0]) : null;
}

export async function deleteCampaign(id: number): Promise<boolean> {
  const { rowCount } = await query('DELETE FROM campaigns WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

/** One series per campaign, with a value for every day in range (missing days are 0). */
export async function dailySeries(days: number, metric: Metric): Promise<MetricSeries[]> {
  const column = METRIC_COLUMNS[metric];
  const { rows } = await query<{ id: number; name: string; day: string; value: number }>(
    `SELECT c.id, c.name, d.day::date AS day, COALESCE(m.${column}, 0) AS value
       FROM campaigns c
      CROSS JOIN generate_series($2::date - ($1::int - 1), $2::date, interval '1 day') AS d(day)
       LEFT JOIN campaign_metrics m
              ON m.campaign_id = c.id
             AND m.day = d.day::date
      ORDER BY c.created_at DESC, c.id DESC, d.day`,
    [days, today()]
  );

  const byCampaign = new Map<number, MetricSeries>();
  for (const row of rows) {
    let series = byCampaign.get(row.id);
    if (!series) {
      series = { campaignId: row.id, name: row.name, points: [] };
      byCampaign.set(row.id, series);
    }
    series.points.push({ day: row.day, value: row.value });
  }
  return [...byCampaign.values()];
}

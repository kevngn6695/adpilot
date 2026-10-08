-- One row per campaign per day. Deleting a campaign removes its metrics.
CREATE TABLE IF NOT EXISTS campaign_metrics (
  campaign_id  INTEGER NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  day          DATE    NOT NULL,
  impressions  INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks       INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  conversions  INTEGER NOT NULL DEFAULT 0 CHECK (conversions >= 0),
  spend_cents  INTEGER NOT NULL DEFAULT 0 CHECK (spend_cents >= 0),
  PRIMARY KEY (campaign_id, day)
);

-- Dashboard queries filter by day range across all campaigns.
CREATE INDEX IF NOT EXISTS campaign_metrics_day_idx ON campaign_metrics (day);

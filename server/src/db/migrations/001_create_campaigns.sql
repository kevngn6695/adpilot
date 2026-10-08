CREATE TABLE IF NOT EXISTS campaigns (
  id                  SERIAL PRIMARY KEY,
  name                TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  objective           TEXT        NOT NULL CHECK (objective IN ('awareness', 'traffic', 'conversions')),
  status              TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  daily_budget_cents  INTEGER     NOT NULL CHECK (daily_budget_cents BETWEEN 500 AND 10000000),
  audience            JSONB       NOT NULL,
  creative            JSONB       NOT NULL,
  start_date          DATE        NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON campaigns (created_at DESC);

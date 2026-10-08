import pg from 'pg';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const SLOW_QUERY_MS = 200;

// DATE columns come back as plain 'YYYY-MM-DD' strings, never shifted by time zone.
pg.types.setTypeParser(1082, (value) => value);
// COUNT/SUM return bigint (int8); every total here fits safely in a JS number.
pg.types.setTypeParser(20, (value) => Number(value));

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  // Managed hosts (Render, etc.) use certificates Node can't verify by default.
  ssl: env.dbSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Idle Postgres client errored');
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: readonly unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params ? [...params] : undefined);
  const duration = Date.now() - start;
  if (duration >= SLOW_QUERY_MS) {
    logger.warn({ duration, text: text.slice(0, 120) }, 'Slow query');
  }
  return result;
}

/** Runs `fn` inside BEGIN/COMMIT, rolling back if it throws. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;

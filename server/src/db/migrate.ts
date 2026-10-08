import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from './pool.js';
import logger from '../utils/logger.js';

/**
 * Raw-SQL migration runner.
 *
 * - Migrations are plain `.sql` files in `./migrations`, applied in file-name order.
 * - Each file runs in its own transaction, so a failure leaves nothing half-applied.
 * - A Postgres advisory lock is held for the whole run, so two instances booting
 *   at once can't race each other.
 * - Applied files are recorded in `schema_migrations`; re-running is a no-op.
 */

// Same relative spot in dev (src/db/migrations) and in the bundled build (dist/migrations).
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const LOCK_KEY = 728_441; // Any constant shared by every instance of this app.

export function listMigrationFiles(dir = MIGRATIONS_DIR): string[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
}

export async function migrate(): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];

  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
    const done = new Set(rows.map((row) => row.name));

    for (const file of listMigrationFiles()) {
      if (done.has(file)) continue;

      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied.push(file);
        logger.info({ file }, 'Applied migration');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => undefined);
    client.release();
  }

  return applied;
}

/** Drops every table this app owns. Development only. */
export async function dropAll(): Promise<void> {
  await pool.query('DROP TABLE IF EXISTS campaign_metrics, campaigns, schema_migrations CASCADE');
}

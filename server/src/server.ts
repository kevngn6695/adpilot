import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import pool from './db/pool.js';
import { migrate } from './db/migrate.js';

async function start(): Promise<void> {
  // Migrations are idempotent and lock-protected, so running them on every boot is safe
  // and means a fresh deploy never serves requests against a missing table.
  await migrate();

  const server = app.listen(env.PORT, () => {
    logger.info(`AdPilot API running at http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start — is Postgres running and DATABASE_URL correct?');
  process.exit(1);
});

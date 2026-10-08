import { defineConfig } from 'vitest/config';

// API tests need a throwaway database: set TEST_DATABASE_URL to run them.
// Without it, only the unit tests run and the API suite is skipped.
export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://unused:unused@localhost:5432/unused',
      ANTHROPIC_API_KEY: '',
    },
    fileParallelism: false,
  },
});

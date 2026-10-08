import 'dotenv/config';
import { z } from 'zod';

/**
 * Every environment variable is read and validated once, here. A missing or
 * malformed value stops the process at boot with the variable's name, instead
 * of surfacing later as a confusing connection error.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5050),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a postgres:// URL' }),
  FRONTEND_URL: z
    .string()
    .url()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  // auto = TLS in production unless the database is on this machine.
  DB_SSL: z.enum(['auto', 'true', 'false']).default('auto'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-haiku-4-5-20251001'),
  APP_TIMEZONE: z
    .string()
    .default('America/Los_Angeles')
    .refine(
      (tz) => {
        try {
          new Intl.DateTimeFormat('en-US', { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      },
      { message: 'APP_TIMEZONE must be an IANA time zone like America/Los_Angeles' }
    ),
  LOG_LEVEL: z
    .enum(['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${problems}`);
}

const dbHost = new URL(parsed.data.DATABASE_URL).hostname;
const isLocalDb = ['localhost', '127.0.0.1', '::1'].includes(dbHost);

const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  dbSsl:
    parsed.data.DB_SSL === 'true' ||
    (parsed.data.DB_SSL === 'auto' && parsed.data.NODE_ENV === 'production' && !isLocalDb),
  hasLlm: Boolean(parsed.data.ANTHROPIC_API_KEY),
};

export default env;

import pool from './pool.js';
import { dropAll, migrate } from './migrate.js';
import { seed } from './seed.js';
import env from '../config/env.js';

/** `npm run db:migrate | db:seed | db:reset` */
async function main(command: string | undefined): Promise<void> {
  switch (command) {
    case 'migrate': {
      const applied = await migrate();
      console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date');
      break;
    }
    case 'seed': {
      await migrate();
      const created = await seed();
      console.log(created ? `Seeded ${created} demo campaigns` : 'Campaigns already exist; seed skipped');
      break;
    }
    case 'reset': {
      if (env.isProduction) throw new Error('db:reset is disabled in production');
      await dropAll();
      await migrate();
      console.log(`Reset complete. Seeded ${await seed()} demo campaigns`);
      break;
    }
    default:
      throw new Error('Usage: cli.ts migrate | seed | reset');
  }
}

main(process.argv[2])
  .catch((err) => {
    console.error((err as Error).message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

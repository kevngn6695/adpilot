// Copies the raw .sql migrations next to the bundled build, so `node dist/cli.js migrate`
// finds them in production exactly where it finds them in development.
import { cpSync } from 'node:fs';

cpSync('src/db/migrations', 'dist/migrations', { recursive: true });
console.log('Copied migrations to dist/migrations');

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import env from './config/env.js';
import logger from './utils/logger.js';
import { sendData, sendError } from './utils/http.js';
import campaignsRoute from './routes/campaigns.routes.js';
import copyRoute from './routes/copy.routes.js';

/**
 * The Express app: middleware, routes, error handling. It starts nothing, so
 * tests can import it and drive it with Supertest without binding a port.
 */
const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({ contentSecurityPolicy: env.isProduction ? undefined : false }));
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4173'].filter(
      (origin): origin is string => Boolean(origin)
    ),
  })
);
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));

app.get('/api/health', (_req, res) => {
  sendData(res, { status: 'ok', aiCopy: env.hasLlm ? 'llm' : 'template' });
});

app.use('/api/campaigns', campaignsRoute);
app.use('/api/copy', copyRoute);

app.use('/api', (_req, res) => sendError(res, 404, 'No API route here'));

// In production one service serves both the API and the built React app.
const clientDist = join(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (env.isProduction && existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1y', index: false }));
  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'), { maxAge: 0 });
  });
}

// Malformed JSON bodies arrive here as a 400, everything else as a 500.
app.use((err: Error & { status?: number; type?: string }, req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    sendError(res, 400, 'Request body is not valid JSON');
    return;
  }
  req.log.error({ err }, 'Unhandled error');
  sendError(res, 500, 'Something went wrong on the server. Try again.');
});

export default app;

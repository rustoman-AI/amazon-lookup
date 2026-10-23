/**
 * Express application factory.
 * Wires CORS (permissive for the Fire TV frontend), a 10 MB JSON body limit,
 * request logging, the analyze + health routes, and a JSON error handler.
 */
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { config } from './config';
import { logger } from './lib/logger';
import { analyzeRouter } from './routes/analyze';
import { healthRouter } from './routes/health';

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: config.jsonLimit }));

  // Request timing + logging.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info('http', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Date.now() - start,
      });
    });
    next();
  });

  app.use(healthRouter);
  app.use(analyzeRouter);

  // 404 for anything else.
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found', path: req.path });
  });

  // Centralized error handler (e.g. body too large / malformed JSON).
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('unhandled', { error: message });
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error', detail: message });
  });

  return app;
}

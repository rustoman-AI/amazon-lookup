/**
 * GET /health — liveness + current mode/model reporting.
 */
import { Router } from 'express';
import { config, hasAwsCredentials } from '../config';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const mode = hasAwsCredentials() ? 'live' : 'mock';
  res.json({
    status: 'ok',
    mode,
    region: config.region,
    model: config.modelId,
    fallbackModel: config.fallbackModelId,
  });
});

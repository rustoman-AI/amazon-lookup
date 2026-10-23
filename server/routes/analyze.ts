/**
 * POST /api/analyze-frame
 *
 * Validates the request, resolves the runtime mode (mock vs live Bedrock),
 * runs detection, enriches with the verified catalog, and returns the strict
 * response schema. Live Bedrock failures degrade gracefully to mock detections
 * unless DISABLE_MOCK_FALLBACK is set.
 */
import { Router, type Request, type Response } from 'express';
import { config, hasAwsCredentials } from '../config';
import { enrichDetections } from '../lib/enrich';
import { logger } from '../lib/logger';
import { analyzeWithBedrock } from '../services/bedrockVision';
import { getMockDetections } from '../services/mockEngine';
import type { AnalyzeRequest, AnalyzeResponse, Mode, RawDetection } from '../types';

export const analyzeRouter = Router();

function wantsMock(req: Request, body: AnalyzeRequest): boolean {
  const queryMock = String(req.query.mock ?? '').toLowerCase() === 'true';
  return queryMock || body.mock === true;
}

analyzeRouter.post('/api/analyze-frame', async (req: Request, res: Response) => {
  const started = Date.now();
  const body = (req.body ?? {}) as AnalyzeRequest;

  const sceneId = typeof body.sceneId === 'string' ? body.sceneId : null;
  const timestamp =
    typeof body.videoTimestamp === 'number' && Number.isFinite(body.videoTimestamp)
      ? body.videoTimestamp
      : 0;

  const forceMock = wantsMock(req, body);
  const credsPresent = hasAwsCredentials();
  const hasImage =
    typeof body.imageBase64 === 'string' && body.imageBase64.trim().length > 0;

  // Resolve mode: explicit mock, or auto-mock when no credentials.
  const useMock = forceMock || !credsPresent;

  // In live mode we require an image. In mock mode the image is optional.
  if (!useMock && !hasImage) {
    return res.status(400).json({
      error: 'imageBase64 is required',
      detail:
        'Provide a non-empty "imageBase64" string, or set mock=true (or ?mock=true) to use demo mode.',
    });
  }

  let mode: Mode = useMock ? 'mock' : 'live';
  let detections: RawDetection[];

  try {
    if (useMock) {
      detections = getMockDetections(sceneId);
    } else {
      try {
        detections = await analyzeWithBedrock(body.imageBase64 as string, body.sceneId);
      } catch (bedrockErr) {
        if (config.disableMockFallback) {
          logger.error('analyze.bedrock_failed_no_fallback', {
            error: bedrockErr instanceof Error ? bedrockErr.message : String(bedrockErr),
          });
          return res.status(502).json({
            error: 'Bedrock analysis failed',
            detail: bedrockErr instanceof Error ? bedrockErr.message : 'unknown error',
          });
        }
        logger.warn('analyze.bedrock_failed_fallback_to_mock', {
          error: bedrockErr instanceof Error ? bedrockErr.message : String(bedrockErr),
        });
        mode = 'mock';
        detections = getMockDetections(sceneId);
      }
    }

    const items = enrichDetections(detections);
    const processingTimeMs = Date.now() - started;

    const payload: AnalyzeResponse = {
      timestamp,
      sceneId,
      mode,
      processingTimeMs,
      items,
    };

    logger.info('analyze.ok', {
      mode,
      sceneId,
      items: items.length,
      processingTimeMs,
    });

    return res.json(payload);
  } catch (err) {
    logger.error('analyze.error', {
      error: err instanceof Error ? err.message : String(err),
    });
    return res.status(500).json({
      error: 'Internal error analyzing frame',
      detail: err instanceof Error ? err.message : 'unknown error',
    });
  }
});

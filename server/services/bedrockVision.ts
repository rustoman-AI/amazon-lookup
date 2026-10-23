/**
 * Amazon Bedrock vision client (Converse API).
 *
 * CRITICAL: the Converse `image` block requires RAW BINARY BYTES (Uint8Array),
 * NOT a base64 string. We strip any data-URL prefix, decode to bytes, and pass
 * them as { image: { format, source: { bytes } } }.
 *
 * The model is prompted (see lib/prompt.ts) to respond with ONLY a JSON array
 * of raw detections. We tolerate accidental markdown fences, parse the array,
 * and hand it to the enrichment pipeline via the caller.
 */
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ContentBlock,
  type ImageFormat,
  type Message,
} from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config';
import { logger } from '../lib/logger';
import { VISION_SYSTEM_PROMPT } from '../lib/prompt';
import type { AiProduct, RawDetection } from '../types';

const client = new BedrockRuntimeClient({ region: config.region });

/** Supported inline image formats for the Converse image block. */
const DATA_URL_RE = /^data:image\/([a-zA-Z0-9.+-]+);base64,/;

interface DecodedImage {
  bytes: Uint8Array;
  format: ImageFormat;
}

/**
 * Strip a data-URL prefix (if present) and decode the base64 payload to raw
 * bytes. Infers the image format from the prefix, defaulting to jpeg.
 */
export function decodeImage(imageBase64: string): DecodedImage {
  const match = imageBase64.match(DATA_URL_RE);
  const declaredFormat = match?.[1]?.toLowerCase();
  const cleanBase64 = imageBase64.replace(DATA_URL_RE, '');

  const bytes = new Uint8Array(Buffer.from(cleanBase64, 'base64'));
  return { bytes, format: toImageFormat(declaredFormat) };
}

function toImageFormat(value: string | undefined): ImageFormat {
  switch (value) {
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    case 'webp':
      return 'webp';
    case 'jpg':
    case 'jpeg':
    default:
      return 'jpeg';
  }
}

/** Remove accidental ```json ... ``` fences the model may wrap around output. */
function stripFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

/**
 * Parse the model's text output into an array of raw detections.
 * Accepts either a bare JSON array or an object wrapping an `items`/`detections`
 * array, and tolerates surrounding prose by extracting the first [...] block.
 */
export function parseDetections(text: string): RawDetection[] {
  const cleaned = stripFences(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Bedrock response did not contain a JSON array');
    }
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  }

  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>)?.items)
      ? (parsed as { items: unknown[] }).items
      : Array.isArray((parsed as Record<string, unknown>)?.detections)
        ? (parsed as { detections: unknown[] }).detections
        : null;

  if (!arr) throw new Error('Bedrock response was not a detections array');

  return arr.map(coerceDetection);
}

function num(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t.length ? t : undefined;
}

/** Parse an AI-read product sub-object (exactMatch / budgetAlternative). */
function coerceAiProduct(raw: unknown): AiProduct | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const title = str(o.title);
  if (!title) return undefined;
  return {
    title,
    brand: str(o.brand),
    estimatedPrice: str(o.estimatedPrice ?? o.price),
    amazonSearchQuery: str(o.amazonSearchQuery ?? o.searchQuery ?? o.query),
  };
}

function coerceDetection(raw: unknown): RawDetection {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    label: String(o.label ?? '') as RawDetection['label'],
    displayLabel: String(o.displayLabel ?? o.label ?? ''),
    x_min: num(o.x_min),
    y_min: num(o.y_min),
    x_max: num(o.x_max),
    y_max: num(o.y_max),
    confidence: num(o.confidence),
    exactMatch: coerceAiProduct(o.exactMatch),
    budgetAlternative: coerceAiProduct(o.budgetAlternative),
  };
}

/**
 * Invoke Bedrock with the frame image and return raw detections.
 * Tries the primary model, then the configured fallback model on failure.
 * Throws if both models fail (the route decides whether to fall back to mock).
 */
export async function analyzeWithBedrock(
  imageBase64: string,
  sceneContext?: string,
): Promise<RawDetection[]> {
  const { bytes, format } = decodeImage(imageBase64);

  const content: ContentBlock[] = [
    { image: { format, source: { bytes } } },
  ];
  if (sceneContext && sceneContext.trim()) {
    content.push({ text: `Scene context: ${sceneContext.trim()}` });
  } else {
    content.push({ text: 'Detect the shoppable products in this frame.' });
  }

  const messages: Message[] = [{ role: 'user', content }];

  const modelsToTry = [config.modelId, config.fallbackModelId].filter(
    (id, i, arr) => id && arr.indexOf(id) === i,
  );

  let lastError: unknown;
  for (const modelId of modelsToTry) {
    try {
      const command = new ConverseCommand({
        modelId,
        system: [{ text: VISION_SYSTEM_PROMPT }],
        messages,
        inferenceConfig: { maxTokens: 1024, temperature: 0 },
      });

      const response = await client.send(command);
      const text =
        response.output?.message?.content
          ?.map((b) => ('text' in b ? b.text : ''))
          .join('')
          .trim() ?? '';

      if (!text) throw new Error('Empty response from Bedrock');

      const detections = parseDetections(text);
      logger.info('bedrock.success', { modelId, count: detections.length });
      return detections;
    } catch (err) {
      lastError = err;
      logger.warn('bedrock.model_failed', {
        modelId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All Bedrock model invocations failed');
}

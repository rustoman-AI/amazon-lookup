/**
 * Amazon LookUp strict schema and internal types.
 */

/**
 * Verified-catalog categories — these have hand-curated exact/budget fallbacks.
 * The live vision model may return OTHER labels (electronics, bag, shoes,
 * clothing, home_decor, etc.); those are kept as free-form strings and rely on
 * the AI-read product data for their Amazon links.
 */
export type Category = 'watch' | 'sunglasses' | 'field_watch' | 'jacket';

export const CATEGORIES: readonly Category[] = [
  'watch',
  'sunglasses',
  'field_watch',
  'jacket',
] as const;

/** Any label the vision engine may emit (catalog category or free-form). */
export type DetectionLabel = Category | string;

export type Mode = 'live' | 'mock';

/** Incoming request body for POST /api/analyze-frame. */
export interface AnalyzeRequest {
  /** "data:image/jpeg;base64,..." — optional when running in mock mode. */
  imageBase64?: string;
  /** Selects the deterministic mock scene, e.g. "sceneA_watch" | "sceneB_biker". */
  sceneId?: string;
  /** Video position in seconds, echoed back as `timestamp`. */
  videoTimestamp?: number;
  /** Force deterministic mock mode (also supported via ?mock=true). */
  mock?: boolean;
}

/**
 * Product information as *read directly off the frame* by the live vision model
 * (brand/model text, visual traits). This is intentionally loose — the model
 * may name any real product, not just something in our verified catalog.
 */
export interface AiProduct {
  title: string;
  brand?: string;
  estimatedPrice?: string;
  amazonSearchQuery?: string;
}

/**
 * Raw detection as produced by the vision model or the mock engine,
 * before catalog enrichment. Coordinates are integers in a 0..1000 space.
 *
 * In live Bedrock mode, `exactMatch`/`budgetAlternative` carry the brand/model
 * the AI actually recognized so we never overwrite authentic brand recognition.
 */
export interface RawDetection {
  label: DetectionLabel;
  displayLabel: string;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  confidence: number;
  /** Optional AI-recognized exact product (live mode). */
  exactMatch?: AiProduct;
  /** Optional AI-recognized budget alternative (live mode). */
  budgetAlternative?: AiProduct;
}

/** A single resolved Amazon product (exact or budget) sent to the frontend. */
export interface CatalogProduct {
  title: string;
  asin: string | null;
  estimatedPrice: string;
  amazonUrl: string;
  /** Brand name when known/recognized. */
  brand?: string;
  /** Raw keyword query used to build the Amazon search URL / QR code. */
  amazonSearchQuery?: string;
}

/** A verified catalog entry for one category. */
export interface CatalogEntry {
  exactMatch: CatalogProduct;
  budgetAlternative: CatalogProduct;
}

/** Fully enriched item returned to the Fire TV frontend. */
export interface AnalyzedItem extends RawDetection {
  id: string;
  category: DetectionLabel;
  exactMatch: CatalogProduct;
  budgetAlternative: CatalogProduct;
}

/** Strict response body for POST /api/analyze-frame. */
export interface AnalyzeResponse {
  timestamp: number;
  sceneId: string | null;
  mode: Mode;
  processingTimeMs: number;
  items: AnalyzedItem[];
}

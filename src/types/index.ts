export type Category = 'watch' | 'sunglasses' | 'field_watch' | 'jacket';

export interface CatalogProduct {
  title: string;
  asin: string | null;
  estimatedPrice: string;
  amazonUrl: string;
  /** Raw keyword query behind amazonUrl (used for the QR code / live search links). */
  amazonSearchQuery?: string;
  imageUrl?: string;
  brand?: string;
  rating?: number;
  reviewsCount?: number;
  keySpecs?: string[];
}

export interface AnalyzedItem {
  id: string;
  label: Category;
  displayLabel: string;
  category: Category;
  x_min: number; // 0 to 1000 space
  y_min: number; // 0 to 1000 space
  x_max: number; // 0 to 1000 space
  y_max: number; // 0 to 1000 space
  confidence: number;
  exactMatch: CatalogProduct;
  budgetAlternative: CatalogProduct;
}

export type CardSelection = 'exact' | 'budget';

export interface VideoChannel {
  id: string;
  sceneId: string;
  channelNumber: number;
  title: string;
  subtitle: string;
  url: string;
  poster?: string;
  defaultItems: AnalyzedItem[];
}

export type AppMode = 'live' | 'demo';

export interface FrameAnalysisResponse {
  timestamp: number;
  sceneId: string | null;
  mode: 'live' | 'mock';
  processingTimeMs: number;
  items: AnalyzedItem[];
}

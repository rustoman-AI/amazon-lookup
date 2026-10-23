/**
 * Enrichment: turn raw detections into fully populated items.
 *
 * - Keeps ANY labeled detection (live Bedrock may detect any consumer product).
 * - Clamps/rounds boxes into the 0-1000 integer space.
 * - Sorts by confidence and caps at the top 4 items.
 * - Products:
 *     * If the model read a real brand/model (exactMatch/budgetAlternative),
 *       honor it — resolveAiProduct always returns a working /s?k= search URL
 *       (curated query for known brands, AI title for unknown ones).
 *     * If the label is a verified catalog category and the model gave no
 *       product, fall back to the curated catalog entry.
 *     * Otherwise, synthesize a search-based product from the display label.
 */
import { CATALOG, resolveAiProduct } from '../data/catalog';
import { searchUrl } from './amazonUrl';
import { CATEGORIES } from '../types';
import type {
  AiProduct,
  AnalyzedItem,
  Category,
  CatalogProduct,
  DetectionLabel,
  RawDetection,
} from '../types';
import { normalizeBox } from './box';

const MAX_ITEMS = 4;

/** Hard ceiling for a "budget alternative" ($19.00 - $99.00 preferred range, under $150.00 max). */
const BUDGET_PRICE_CEILING = 150;

/** Luxury / high-end brands that must NEVER appear in the budget alternative card. */
const LUXURY_BRANDS = [
  'omega',
  'rolex',
  'breitling',
  'tag heuer',
  'tagheuer',
  'vacheron',
  'patek',
  'audemars',
  'cartier',
  'richard mille',
  'schott',
  'belstaff',
  'gucci',
  'prada',
  'louis vuitton',
];

function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

function clampConfidence(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const bounded = Math.min(1, Math.max(0, n));
  return Math.round(bounded * 100) / 100;
}

function hasUsableLabel(d: RawDetection): boolean {
  return Boolean((d.label && String(d.label).trim()) || (d.displayLabel && d.displayLabel.trim()));
}

/** Build a generic search-based product when we have no catalog entry or AI data. */
function syntheticProduct(keywords: string, kind: 'exact' | 'budget'): CatalogProduct {
  const q = keywords.trim() || 'consumer product';
  const query = kind === 'budget' ? `${q} affordable` : q;
  return {
    title: kind === 'budget' ? `${q} (Budget Alternative)` : q,
    asin: null,
    estimatedPrice: kind === 'budget' ? '$29.99' : 'See price on Amazon',
    amazonUrl: searchUrl(query),
    amazonSearchQuery: query,
  };
}

/** Parse a price string like "$1,495.00" / "$89" into a number; NaN if unparseable. */
function parsePrice(price: string | undefined): number {
  if (!price) return NaN;
  const cleaned = price.replace(/[^0-9.]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/** Check if a product title or brand contains luxury/designer keywords. */
function isLuxuryProduct(p: CatalogProduct): boolean {
  const text = `${p.brand ?? ''} ${p.title ?? ''}`.toLowerCase();
  return LUXURY_BRANDS.some((b) => text.includes(b));
}

/**
 * Compose a drawer/pill title from the exactMatch brand + title, ensuring that
 * `displayLabel` and `exactMatch.title` refer to the exact same brand and model,
 * avoiding a duplicated leading brand word (e.g. brand "Fossil" + title "Fossil Nate ..."
 * -> "Fossil Nate ...", not "Fossil Fossil Nate ...").
 */
function composeDisplayLabel(exact: AiProduct, fallback: string): string {
  const title = exact.title?.trim() ?? '';
  const brand = exact.brand?.trim() ?? '';
  if (!title) return brand || fallback;
  if (!brand) return title;
  // If the title already starts with the brand (case-insensitive), use title as-is.
  if (title.toLowerCase().startsWith(brand.toLowerCase())) return title;
  return `${brand} ${title}`;
}

/**
 * True budget fallbacks per category, used when the AI's budgetAlternative is
 * missing or accidentally priced like a luxury item (> $150). Keeps the Budget
 * card dramatically cheaper than the Exact Match and strictly Prime-affordable ($19.00 - $99.00).
 */
const BUDGET_FALLBACK: Record<string, CatalogProduct> = {
  watch: {
    title: 'Casio Edifice Stainless Steel Chronograph',
    asin: null,
    estimatedPrice: '$89.99',
    amazonUrl: searchUrl('Casio Edifice Chronograph Stainless Steel Watch'),
    brand: 'Casio',
    amazonSearchQuery: 'Casio Edifice Chronograph Stainless Steel Watch',
  },
  field_watch: {
    title: 'Timex Expedition Scout 40mm Field Watch',
    asin: null,
    estimatedPrice: '$52.00',
    amazonUrl: searchUrl('Timex Expedition Scout 40mm Watch'),
    brand: 'Timex',
    amazonSearchQuery: 'Timex Expedition Scout 40mm Watch',
  },
  sunglasses: {
    title: 'SOJOS Retro Polarized Sunglasses',
    asin: null,
    estimatedPrice: '$19.99',
    amazonUrl: searchUrl('SOJOS Retro Polarized Sunglasses'),
    brand: 'SOJOS',
    amazonSearchQuery: 'SOJOS Retro Polarized Sunglasses',
  },
  jacket: {
    title: "Levi's Faux Leather Moto Jacket (Black)",
    asin: null,
    estimatedPrice: '$89.99',
    amazonUrl: searchUrl("Levi's Faux Leather Moto Jacket Black"),
    brand: "Levi's",
    amazonSearchQuery: "Levi's Faux Leather Moto Jacket Black",
  },
};

/** Generic cheap everyday fallback for any non-catalog category. */
const GENERIC_BUDGET_FALLBACK: CatalogProduct = {
  title: 'Everyday Budget Alternative',
  asin: null,
  estimatedPrice: '$29.99',
  amazonUrl: searchUrl('affordable everyday alternative'),
  amazonSearchQuery: 'affordable everyday alternative',
};

/**
 * Guarantee the budget card is genuinely affordable ($19.00 - $99.00 / under $150.00 ceiling).
 * If the AI-resolved budget product has no price, a price above ceiling, or a luxury brand,
 * replace it with a true budget equivalent for the item's category.
 */
function ensureBudget(budget: CatalogProduct, label: DetectionLabel): CatalogProduct {
  const price = parsePrice(budget.estimatedPrice);
  const tooExpensive = Number.isFinite(price) && price > BUDGET_PRICE_CEILING;
  const isLuxury = isLuxuryProduct(budget);
  if (!tooExpensive && !isLuxury && Number.isFinite(price) && price >= 10) return budget;
  const key = isCategory(label) ? label : 'generic';
  return BUDGET_FALLBACK[key] ?? GENERIC_BUDGET_FALLBACK;
}

/**
 * Enrich an array of raw detections. Result is sorted by confidence (desc),
 * limited to MAX_ITEMS, and given stable ids.
 */
export function enrichDetections(raw: RawDetection[]): AnalyzedItem[] {
  const valid = raw.filter(hasUsableLabel);

  const sorted = [...valid].sort(
    (a, b) => clampConfidence(b.confidence) - clampConfidence(a.confidence),
  );

  return sorted.slice(0, MAX_ITEMS).map((d, index) => {
    const label: DetectionLabel = (d.label && String(d.label).trim()) || 'product';
    const boxed = normalizeBox(d);
    const catalogEntry = isCategory(label) ? CATALOG[label] : undefined;

    const exactMatch: CatalogProduct = d.exactMatch
      ? resolveAiProduct(d.exactMatch)
      : catalogEntry
        ? catalogEntry.exactMatch
        : syntheticProduct(d.displayLabel?.trim() || defaultDisplayLabel(label), 'exact');

    let budgetAlternative: CatalogProduct = d.budgetAlternative
      ? resolveAiProduct(d.budgetAlternative)
      : catalogEntry
        ? catalogEntry.budgetAlternative
        : syntheticProduct(d.displayLabel?.trim() || defaultDisplayLabel(label), 'budget');

    // CONSISTENCY: `displayLabel` and `exactMatch.title` MUST always refer to the
    // exact same brand and model. When exactMatch is present, compose displayLabel
    // directly from it so they never disagree.
    const displayLabel = d.exactMatch
      ? composeDisplayLabel(d.exactMatch, d.displayLabel?.trim() || defaultDisplayLabel(label))
      : d.displayLabel?.trim() || defaultDisplayLabel(label);

    // SANITY: strictly enforce everyday Amazon Prime budget price ($19.00 - $99.00 / under $150).
    budgetAlternative = ensureBudget(budgetAlternative, label);

    const item: AnalyzedItem = {
      id: `item_${index + 1}`,
      label,
      displayLabel,
      category: label,
      confidence: clampConfidence(d.confidence),
      x_min: boxed.x_min,
      y_min: boxed.y_min,
      x_max: boxed.x_max,
      y_max: boxed.y_max,
      exactMatch,
      budgetAlternative,
    };
    return item;
  });
}

function defaultDisplayLabel(label: DetectionLabel): string {
  switch (label) {
    case 'watch':
      return 'Wristwatch';
    case 'sunglasses':
      return 'Sunglasses';
    case 'field_watch':
      return 'Field Watch';
    case 'jacket':
      return 'Jacket';
    default:
      // Humanize free-form labels like "home_decor" -> "Home Decor".
      return String(label)
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

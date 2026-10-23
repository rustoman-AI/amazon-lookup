/**
 * Verified Amazon Product Catalog (Catalog Matcher).
 *
 * Every link uses a clean, high-precision Amazon SEARCH URL
 * (https://www.amazon.com/s?k=<brand+model>) — never a /dp/ASIN deep link.
 * Direct ASIN pages frequently go out of stock or 404, whereas a brand+model
 * search always opens real, in-stock, buyable listings. We therefore keep
 * `asin: null` everywhere and derive URLs from a search query.
 *
 * In LIVE Bedrock mode we do NOT overwrite the model's brand reading.
 * `matchVerifiedProduct()` recognizes known brands (Omega, Ray-Ban, Hamilton,
 * Invicta, Casio, etc.) and maps them to a curated, high-precision search query;
 * unknown brands keep the AI-read title and build a search from it.
 */
import type { Category, CatalogEntry, CatalogProduct } from '../types';
import { searchUrl } from '../lib/amazonUrl';

export const CATALOG: Record<Category, CatalogEntry> = {
  watch: {
    exactMatch: {
      title: 'Omega Seamaster Diver 300M Chronograph 44mm',
      asin: null,
      estimatedPrice: '$7,675.00',
      amazonUrl: 'https://www.amazon.com/s?k=Omega+Seamaster+Diver+300M+Chronograph+Watch',
      brand: 'Omega',
      amazonSearchQuery: 'Omega Seamaster Diver 300M Chronograph Watch',
    },
    budgetAlternative: {
      title: 'Invicta Pro Diver Scuba 48mm Chronograph (0077)',
      asin: null,
      estimatedPrice: '$89.99',
      amazonUrl: 'https://www.amazon.com/s?k=Invicta+Pro+Diver+Chronograph+Watch',
      brand: 'Invicta',
      amazonSearchQuery: 'Invicta Pro Diver Chronograph Watch',
    },
  },

  sunglasses: {
    exactMatch: {
      title: 'Ray-Ban RB4416 New Clubmaster Polarized',
      asin: null,
      estimatedPrice: '$213.00',
      amazonUrl: 'https://www.amazon.com/s?k=Ray-Ban+Clubmaster+Polarized+Sunglasses',
      brand: 'Ray-Ban',
      amazonSearchQuery: 'Ray-Ban Clubmaster Polarized Sunglasses',
    },
    budgetAlternative: {
      title: 'SOJOS Retro Polarized Square Sunglasses (SJ2229)',
      asin: null,
      estimatedPrice: '$14.99',
      amazonUrl: 'https://www.amazon.com/s?k=SOJOS+Retro+Polarized+Sunglasses',
      brand: 'SOJOS',
      amazonSearchQuery: 'SOJOS Retro Polarized Sunglasses',
    },
  },

  field_watch: {
    exactMatch: {
      title: 'Hamilton Khaki Field Mechanical 38mm (H69439931)',
      asin: null,
      estimatedPrice: '$675.00',
      amazonUrl: 'https://www.amazon.com/s?k=Hamilton+Khaki+Field+Mechanical+Watch',
      brand: 'Hamilton',
      amazonSearchQuery: 'Hamilton Khaki Field Mechanical Watch',
    },
    budgetAlternative: {
      title: 'Timex Expedition Scout 40mm Field Watch',
      asin: null,
      estimatedPrice: '$52.00',
      amazonUrl: 'https://www.amazon.com/s?k=Timex+Expedition+Scout+40mm+Watch',
      brand: 'Timex',
      amazonSearchQuery: 'Timex Expedition Scout 40mm Watch',
    },
  },

  jacket: {
    exactMatch: {
      title: "Men's Genuine Leather Motorcycle Biker Jacket (Black)",
      asin: null,
      estimatedPrice: '$229.00',
      amazonUrl: 'https://www.amazon.com/s?k=Mens+Genuine+Leather+Motorcycle+Biker+Jacket+Black',
      brand: 'Leather',
      amazonSearchQuery: 'Mens Genuine Leather Motorcycle Biker Jacket Black',
    },
    budgetAlternative: {
      title: "Men's Faux Leather Motorcycle Bomber Jacket (Black)",
      asin: null,
      estimatedPrice: '$69.99',
      amazonUrl: 'https://www.amazon.com/s?k=Mens+Faux+Leather+Motorcycle+Bomber+Jacket+Black',
      brand: 'Generic',
      amazonSearchQuery: 'Mens Faux Leather Motorcycle Bomber Jacket Black',
    },
  },
};

/**
 * Known brand/model keywords mapped to curated, high-precision Amazon SEARCH
 * queries. When the live AI reads one of these brands off the frame, we use the
 * curated query (which reliably surfaces the right in-stock product) rather than
 * a fragile /dp/ASIN.
 */
interface VerifiedProduct {
  canonicalTitle: string;
  brand: string;
  estimatedPrice: string;
  amazonSearchQuery: string;
}

const VERIFIED_PRODUCTS: Record<string, VerifiedProduct> = {
  omega: {
    canonicalTitle: 'Omega Seamaster Diver 300M Chronograph 44mm',
    brand: 'Omega',
    estimatedPrice: '$7,675.00',
    amazonSearchQuery: 'Omega Seamaster Diver 300M Chronograph Watch',
  },
  invicta: {
    canonicalTitle: 'Invicta Pro Diver Scuba 48mm Chronograph (0077)',
    brand: 'Invicta',
    estimatedPrice: '$89.99',
    amazonSearchQuery: 'Invicta Pro Diver Chronograph Watch',
  },
  rayban: {
    canonicalTitle: 'Ray-Ban Clubmaster Polarized Sunglasses',
    brand: 'Ray-Ban',
    estimatedPrice: '$213.00',
    amazonSearchQuery: 'Ray-Ban Clubmaster Polarized Sunglasses',
  },
  sojos: {
    canonicalTitle: 'SOJOS Retro Polarized Square Sunglasses (SJ2229)',
    brand: 'SOJOS',
    estimatedPrice: '$14.99',
    amazonSearchQuery: 'SOJOS Retro Polarized Sunglasses',
  },
  hamilton: {
    canonicalTitle: 'Hamilton Khaki Field Mechanical 38mm (H69439931)',
    brand: 'Hamilton',
    estimatedPrice: '$675.00',
    amazonSearchQuery: 'Hamilton Khaki Field Mechanical Watch',
  },
  timex: {
    canonicalTitle: 'Timex Expedition Scout 40mm Field Watch',
    brand: 'Timex',
    estimatedPrice: '$52.00',
    amazonSearchQuery: 'Timex Expedition Scout 40mm Watch',
  },
  casio: {
    canonicalTitle: 'Casio Edifice Stainless Steel Chronograph',
    brand: 'Casio',
    estimatedPrice: '$89.99',
    amazonSearchQuery: 'Casio Edifice Chronograph Stainless Steel Watch',
  },
  fossil: {
    canonicalTitle: "Fossil Men's Nate Chronograph Stainless Steel Watch",
    brand: 'Fossil',
    estimatedPrice: '$149.00',
    amazonSearchQuery: 'Fossil Nate Chronograph Stainless Steel Watch',
  },
};

/** Lowercase keyword(s) that, if found in the AI title/brand, map to a verified product. */
const BRAND_KEYWORDS: Array<{ keywords: string[]; key: string }> = [
  { keywords: ['omega', 'seamaster'], key: 'omega' },
  { keywords: ['invicta'], key: 'invicta' },
  { keywords: ['ray-ban', 'rayban', 'ray ban', 'clubmaster'], key: 'rayban' },
  { keywords: ['sojos'], key: 'sojos' },
  { keywords: ['hamilton', 'khaki field'], key: 'hamilton' },
  { keywords: ['timex', 'expedition'], key: 'timex' },
  { keywords: ['casio', 'edifice'], key: 'casio' },
  { keywords: ['fossil'], key: 'fossil' },
];

/**
 * Given a brand/title string the AI read off the frame, return the matching
 * verified product if we recognize the brand. Returns undefined for unknown
 * brands so the caller keeps the AI's own title and builds a search from it.
 */
export function matchVerifiedProduct(
  title: string | undefined,
  brand?: string,
): VerifiedProduct | undefined {
  const haystack = `${brand ?? ''} ${title ?? ''}`.toLowerCase();
  if (!haystack.trim()) return undefined;
  for (const entry of BRAND_KEYWORDS) {
    if (entry.keywords.some((kw) => haystack.includes(kw))) {
      return VERIFIED_PRODUCTS[entry.key];
    }
  }
  return undefined;
}

/**
 * Resolve an AI-read product into a frontend CatalogProduct. ALWAYS returns a
 * working https://www.amazon.com/s?k=... search URL (asin stays null):
 * - Known brand  -> curated high-precision search query.
 * - Unknown brand -> preserve the AI title and search for it.
 */
export function resolveAiProduct(ai: {
  title: string;
  brand?: string;
  estimatedPrice?: string;
  amazonSearchQuery?: string;
}): CatalogProduct {
  const verified = matchVerifiedProduct(ai.title, ai.brand);
  if (verified) {
    const query = ai.amazonSearchQuery?.trim() || verified.amazonSearchQuery;
    return {
      title: ai.title?.trim() || verified.canonicalTitle,
      asin: null,
      estimatedPrice: ai.estimatedPrice?.trim() || verified.estimatedPrice,
      amazonUrl: searchUrl(query),
      brand: ai.brand?.trim() || verified.brand,
      amazonSearchQuery: query,
    };
  }

  // Unknown brand — preserve exactly what Bedrock read from the frame.
  const query = (ai.amazonSearchQuery?.trim() || ai.title?.trim() || '').trim();
  return {
    title: ai.title?.trim() || 'Detected Product',
    asin: null,
    estimatedPrice: ai.estimatedPrice?.trim() || 'See price on Amazon',
    amazonUrl: searchUrl(query),
    brand: ai.brand?.trim() || undefined,
    amazonSearchQuery: query,
  };
}

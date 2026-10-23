/**
 * Amazon URL builders.
 */

/** Canonical product detail URL from an ASIN. */
export function dpUrl(asin: string): string {
  return `https://www.amazon.com/dp/${encodeURIComponent(asin)}`;
}

/**
 * Amazon search URL from free-text keywords.
 * Amazon's `k` param accepts '+' for spaces; we URL-encode then restore '+'.
 */
export function searchUrl(keywords: string): string {
  const k = encodeURIComponent(keywords.trim()).replace(/%20/g, '+');
  return `https://www.amazon.com/s?k=${k}`;
}

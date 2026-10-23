/**
 * Deterministic mock / demo engine.
 *
 * Returns hand-tuned raw detections (0-1000 integer boxes) keyed by sceneId so
 * the Fire TV frontend and hackathon judges can evaluate the full experience
 * without any AWS setup. Output is later passed through the same enrichment
 * pipeline as live Bedrock results.
 *
 * All products carry an `amazonSearchQuery`; enrichment turns these into clean
 * https://www.amazon.com/s?k=... links (never dead /dp/ASIN deep links).
 */
import type { RawDetection } from '../types';

/**
 * Channel 1 (28896-720.mp4) — extreme macro close-up of a Fossil Q Hybrid
 * wristwatch filling the center of the frame.
 */
const FOSSIL_Q_HYBRID: RawDetection = {
  label: 'watch',
  displayLabel: 'Fossil Q Hybrid Chronograph Smartwatch',
  x_min: 140,
  y_min: 60,
  x_max: 830,
  y_max: 940,
  confidence: 0.97,
  exactMatch: {
    title: "Fossil Men's Q Nate / Grant Hybrid Stainless Steel Smartwatch",
    brand: 'Fossil',
    estimatedPrice: '$175.00',
    amazonSearchQuery: 'Fossil Nate Chronograph Stainless Steel Watch',
  },
  budgetAlternative: {
    title: 'Casio Edifice Stainless Steel Chronograph',
    brand: 'Casio',
    estimatedPrice: '$89.99',
    amazonSearchQuery: 'Casio Edifice Chronograph Stainless Steel Watch',
  },
};

/**
 * Channel 4 (3649-720.mp4) — extreme macro of a luxury Swiss moonphase dial.
 * The frame is a blurry close-up; if live Nova Pro slightly misreads it, this
 * mock cache catches it precisely as a Frederique Constant moonphase, with an
 * affordable Seiko moonphase/calendar budget alternative.
 */
const FREDERIQUE_MOONPHASE: RawDetection = {
  label: 'watch',
  displayLabel: 'Frederique Constant Classics Heart Beat Moonphase',
  // Precise bounds capturing the circular macro dial.
  x_min: 70,
  y_min: 5,
  x_max: 760,
  y_max: 950,
  confidence: 0.95,
  exactMatch: {
    title: 'Classics Heart Beat Moonphase Automatic Watch',
    brand: 'FREDERIQUE CONSTANT',
    estimatedPrice: '$1,850.00',
    amazonSearchQuery: 'Frederique Constant Classics Moonphase Watch',
  },
  budgetAlternative: {
    title: 'Discover More Chronograph Calendar Watch',
    brand: 'SEIKO',
    estimatedPrice: '$145.00',
    amazonSearchQuery: 'Seiko Neo Classic Moonphase Watch',
  },
};

// ---- Channel 2 (45-720.mp4) — biker standing on the RIGHT side of frame ----

const BIKER_SUNGLASSES: RawDetection = {
  label: 'sunglasses',
  displayLabel: 'Clubmaster Polarized Sunglasses',
  x_min: 715,
  y_min: 310,
  x_max: 775,
  y_max: 355,
  confidence: 0.92,
  exactMatch: {
    title: 'Ray-Ban RB4416 New Clubmaster Polarized',
    brand: 'Ray-Ban',
    estimatedPrice: '$213.00',
    amazonSearchQuery: 'Ray-Ban Clubmaster Polarized Sunglasses',
  },
  budgetAlternative: {
    title: 'SOJOS Retro Polarized Square Sunglasses (SJ2229)',
    brand: 'SOJOS',
    estimatedPrice: '$14.99',
    amazonSearchQuery: 'SOJOS Retro Polarized Sunglasses',
  },
};

const BIKER_WATCH: RawDetection = {
  label: 'watch',
  displayLabel: 'Chronograph Wristwatch',
  x_min: 700,
  y_min: 470,
  x_max: 740,
  y_max: 515,
  confidence: 0.89,
  exactMatch: {
    title: "Fossil Men's Nate Chronograph Stainless Steel Watch",
    brand: 'Fossil',
    estimatedPrice: '$149.00',
    amazonSearchQuery: 'Fossil Nate Chronograph Stainless Steel Watch',
  },
  budgetAlternative: {
    title: 'Casio Edifice Stainless Steel Chronograph',
    brand: 'Casio',
    estimatedPrice: '$89.99',
    amazonSearchQuery: 'Casio Edifice Chronograph Stainless Steel Watch',
  },
};

const BIKER_JACKET: RawDetection = {
  label: 'jacket',
  displayLabel: 'Black Leather Biker Jacket',
  x_min: 680,
  y_min: 380,
  x_max: 835,
  y_max: 910,
  confidence: 0.94,
  exactMatch: {
    title: "Men's Genuine Leather Motorcycle Biker Jacket (Black)",
    brand: 'Leather',
    estimatedPrice: '$229.00',
    amazonSearchQuery: 'Mens Genuine Leather Motorcycle Biker Jacket Black',
  },
  budgetAlternative: {
    title: "Men's Faux Leather Motorcycle Bomber Jacket (Black)",
    brand: 'Generic',
    estimatedPrice: '$69.99',
    amazonSearchQuery: 'Mens Faux Leather Motorcycle Bomber Jacket Black',
  },
};

// ---- Channel 3 (101-720.mp4) — man centered, walking through city ----

const RECON_SUNGLASSES: RawDetection = {
  label: 'sunglasses',
  displayLabel: 'Clubmaster Polarized Sunglasses',
  x_min: 300,
  y_min: 360,
  x_max: 445,
  y_max: 450,
  confidence: 0.93,
  exactMatch: {
    title: 'Ray-Ban RB4416 New Clubmaster Polarized',
    brand: 'Ray-Ban',
    estimatedPrice: '$213.00',
    amazonSearchQuery: 'Ray-Ban Clubmaster Polarized Sunglasses',
  },
  budgetAlternative: {
    title: 'SOJOS Retro Polarized Square Sunglasses (SJ2229)',
    brand: 'SOJOS',
    estimatedPrice: '$14.99',
    amazonSearchQuery: 'SOJOS Retro Polarized Sunglasses',
  },
};

const RECON_JACKET: RawDetection = {
  label: 'jacket',
  displayLabel: 'Black Shearling Bomber Jacket',
  x_min: 120,
  y_min: 575,
  x_max: 610,
  y_max: 985,
  confidence: 0.91,
  exactMatch: {
    title: "Men's Genuine Leather Motorcycle Biker Jacket (Black)",
    brand: 'Leather',
    estimatedPrice: '$229.00',
    amazonSearchQuery: 'Mens Genuine Leather Motorcycle Biker Jacket Black',
  },
  budgetAlternative: {
    title: "Men's Faux Leather Motorcycle Bomber Jacket (Black)",
    brand: 'Generic',
    estimatedPrice: '$69.99',
    amazonSearchQuery: 'Mens Faux Leather Motorcycle Bomber Jacket Black',
  },
};

const SCENES: Record<string, RawDetection[]> = {
  // Channel 1 — macro close-up of the Fossil Q Hybrid watch.
  sceneA_watch: [FOSSIL_Q_HYBRID],
  // Channel 2 — biker on the RIGHT: sunglasses + wristwatch + leather jacket.
  sceneB_biker: [BIKER_SUNGLASSES, BIKER_WATCH, BIKER_JACKET],
  // Channel 3 — urban recon: centered sunglasses + jacket.
  sceneC_recon: [RECON_SUNGLASSES, RECON_JACKET],
  // Channel 4 — "Luxury Vault": Frederique Constant moonphase macro.
  sceneD_moonphase: [FREDERIQUE_MOONPHASE],
  // Back-compat alias for the previous sceneId.
  sceneD_omega: [FREDERIQUE_MOONPHASE],
};

/** Default scene used when sceneId is absent or unrecognized. */
const DEFAULT_SCENE: RawDetection[] = [FOSSIL_Q_HYBRID];

/**
 * Resolve deterministic raw detections for a given sceneId.
 * Returns fresh object copies so downstream normalization never mutates the
 * shared scene definitions.
 */
export function getMockDetections(sceneId?: string | null): RawDetection[] {
  const scene = (sceneId && SCENES[sceneId]) || DEFAULT_SCENE;
  return scene.map((d) => ({ ...d }));
}

export const MOCK_SCENE_IDS = Object.keys(SCENES);

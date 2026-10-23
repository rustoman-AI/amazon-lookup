/**
 * Local mock smoke test — exercises the enrichment + mock pipeline directly
 * (no network) and asserts the strict schema, 0-1000 integer boxes, catalog
 * enrichment, corrected per-channel coordinates, and that EVERY Amazon link is
 * a working /s?k= search URL (no dead /dp/ASIN links).
 */
import { enrichDetections } from './lib/enrich';
import { getMockDetections } from './services/mockEngine';
import type { AnalyzedItem } from './types';

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log(`ok: ${msg}`);
}

function checkSearchUrl(p: { asin: string | null; amazonUrl: string }, who: string): void {
  assert(p.asin === null, `${who} ASIN is null (no /dp link)`);
  assert(p.amazonUrl.startsWith('https://www.amazon.com/s?k='), `${who} uses /s?k= search URL`);
  assert(!p.amazonUrl.includes('/dp/'), `${who} has no /dp/ deep link`);
}

function checkBox(item: AnalyzedItem): void {
  for (const v of [item.x_min, item.y_min, item.x_max, item.y_max]) {
    assert(Number.isInteger(v) && v >= 0 && v <= 1000, `coord in 0-1000 int range (${v})`);
  }
  assert(item.x_max > item.x_min, `x_max > x_min for ${item.label}`);
  assert(item.y_max > item.y_min, `y_max > y_min for ${item.label}`);
  assert(Boolean(item.exactMatch?.title), `exactMatch present for ${item.label}`);
  assert(Boolean(item.budgetAlternative?.title), `budgetAlternative present for ${item.label}`);
  checkSearchUrl(item.exactMatch, `${item.label} exact`);
  checkSearchUrl(item.budgetAlternative, `${item.label} budget`);
}

function box(it: AnalyzedItem): string {
  return `${it.x_min},${it.y_min},${it.x_max},${it.y_max}`;
}

// Channel 1 (sceneA_watch) — Fossil Q Hybrid macro close-up.
const a = enrichDetections(getMockDetections('sceneA_watch'));
assert(a.length === 1, 'sceneA_watch returns exactly 1 item');
assert(a[0].label === 'watch', 'sceneA item is a watch');
assert(a[0].displayLabel.toLowerCase().includes('fossil'), 'sceneA item is the Fossil Q Hybrid');
assert(box(a[0]) === '140,60,830,940', 'sceneA box frames the macro watch case (140,60,830,940)');
a.forEach(checkBox);

// Channel 2 (sceneB_biker) — biker on the RIGHT: sunglasses + watch + jacket.
const b = enrichDetections(getMockDetections('sceneB_biker'));
assert(b.length === 3, 'sceneB_biker returns 3 items');
const bLabels = b.map((i) => i.label).sort();
assert(bLabels.join(',') === 'jacket,sunglasses,watch', 'sceneB has sunglasses + watch + jacket');
const bSun = b.find((i) => i.label === 'sunglasses')!;
const bWatch = b.find((i) => i.label === 'watch')!;
const bJacket = b.find((i) => i.label === 'jacket')!;
assert(box(bSun) === '715,310,775,355', 'Ch2 sunglasses box 715,310,775,355');
assert(box(bWatch) === '700,470,740,515', 'Ch2 watch box 700,470,740,515');
assert(box(bJacket) === '680,380,835,910', 'Ch2 jacket box 680,380,835,910');
b.forEach(checkBox);

// Channel 3 (sceneC_recon) — centered on the walking man.
const c = enrichDetections(getMockDetections('sceneC_recon'));
assert(c.length === 2, 'sceneC_recon returns 2 items');
const cSun = c.find((i) => i.label === 'sunglasses')!;
const cJacket = c.find((i) => i.label === 'jacket')!;
assert(box(cSun) === '300,360,445,450', 'Ch3 sunglasses box 300,360,445,450');
assert(box(cJacket) === '120,575,610,985', 'Ch3 jacket box 120,575,610,985');
c.forEach(checkBox);

// Channel 4 (sceneD_moonphase) — Frederique Constant moonphase macro.
const ch4 = enrichDetections(getMockDetections('sceneD_moonphase'));
assert(ch4.length === 1, 'sceneD_moonphase returns exactly 1 item');
assert(
  ch4[0].displayLabel.toLowerCase().includes('frederique'),
  'Ch4 displayLabel is Frederique Constant',
);
assert(
  ch4[0].exactMatch.amazonUrl.includes('Frederique+Constant'),
  'Ch4 exact uses Frederique Constant search URL',
);
assert(ch4[0].budgetAlternative.brand === 'SEIKO', 'Ch4 budget is Seiko');
assert(
  box(ch4[0]) === '70,5,760,950',
  'Ch4 box frames the macro dial (70,5,760,950)',
);
ch4.forEach(checkBox);

console.log('\nAll smoke assertions passed.');

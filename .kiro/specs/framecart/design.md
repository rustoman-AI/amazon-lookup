# Amazon LookUp - Design

> AI-Powered Shoppable TV X-Ray for Fire TV & Vega OS - backend service design.

## 1. Overview

Amazon LookUp's backend is an ultra-lightweight **Node.js + TypeScript + Express** service exposing one core endpoint, `POST /api/analyze-frame`. It accepts a base64 video frame and either:

- **Live mode** - invokes **Amazon Bedrock** (`us.amazon.nova-pro-v1:0`, fallback `us.anthropic.claude-3-5-sonnet-20241022-v2:0`) in `us-east-1` via the Converse API, passing the frame as raw image bytes; or
- **Mock mode** - returns deterministic, `sceneId`-driven detections with no AWS dependency.

Either way, raw detections are enriched from a verified Amazon product catalog and returned in a strict schema using a **0-1000 integer coordinate space**. Every product link is a clean `https://www.amazon.com/s?k=...` search URL.

## 2. Architecture

```
            Fire TV Frontend  --POST /api/analyze-frame-->
                                                          |
        +-------------------------------------------------+
        |                  Express App                     |
        |  cors() - express.json(10mb) - request logger    |
        |                                                  |
        |  routes/analyze.ts                               |
        |    - validate body                               |
        |    - resolveMode(mock?, hasAwsCreds?)            |
        |          |                    |                  |
        |  [ bedrockVision ]      [ mockEngine ]           |
        |  Converse API           sceneId -> raw dets      |
        |  Uint8Array img            |                     |
        |          | on error -------+ fallback            |
        |          v                                       |
        |  enrich(rawDetections) - catalog + box clamp     |
        +------------------------+-------------------------+
                                 v
                         Strict JSON response
```

## 3. Technology choices

| Concern | Choice |
| --- | --- |
| Runtime | Node.js >= 18 |
| Language | TypeScript (strict) |
| HTTP | Express 4 + `cors` |
| JSON limit | `10mb` |
| AI SDK | `@aws-sdk/client-bedrock-runtime` v3, region `us-east-1` |
| Model | `us.amazon.nova-pro-v1:0` (default), Claude 3.5 Sonnet (fallback) |
| Config | `dotenv` |
| Dev run | `tsx` |

## 4. Module layout

```
server/
  index.ts                 bootstrap: dotenv + listen on 0.0.0.0:3001
  app.ts                   express factory: cors, json(10mb), logger, routes, error handler
  config.ts                env parsing, defaults, hasAwsCredentials()
  types.ts                 strict request/response + catalog + raw-detection interfaces
  data/catalog.ts          verified product dictionary (search-URL based)
  lib/
    prompt.ts              Bedrock system prompt (reads real brand/model)
    amazonUrl.ts           searchUrl(keywords) + dpUrl(asin) helpers
    enrich.ts              raw detection -> enriched item (catalog + box clamp/validate)
    box.ts                 0-1000 integer clamp/round helpers
    logger.ts              tiny structured logger
  services/
    bedrockVision.ts       Converse call: strip prefix, Uint8Array bytes, parse JSON
    mockEngine.ts          sceneId -> deterministic raw detections
  routes/
    analyze.ts             POST /api/analyze-frame
    health.ts              GET /health
```

## 5. Data model

### 5.1 Request (`POST /api/analyze-frame`)

```ts
interface AnalyzeRequest {
  imageBase64?: string;   // "data:image/jpeg;base64,..." (optional in mock mode)
  sceneId?: string;       // selects mock scene, e.g. "sceneA_watch" | "sceneB_biker"
  videoTimestamp?: number;
  mock?: boolean;         // force mock (also supported via ?mock=true)
}
```

### 5.2 Raw detection (model / mock output, pre-enrichment)

```ts
interface RawDetection {
  label: string;          // 'watch' | 'sunglasses' | 'field_watch' | 'jacket' | free-form
  displayLabel: string;
  x_min: number; y_min: number; x_max: number; y_max: number; // 0..1000 ints
  confidence: number;     // 0..1
  exactMatch?: AiProduct;         // read off the frame in live mode
  budgetAlternative?: AiProduct;
}
```

### 5.3 Response item

```ts
interface AnalyzedItem extends RawDetection {
  id: string;             // "item_1"
  category: string;
  exactMatch: CatalogProduct;      // { title, asin:null, estimatedPrice, amazonUrl (/s?k=), brand, amazonSearchQuery }
  budgetAlternative: CatalogProduct;
}
```

## 6. Amazon link policy

Every `amazonUrl` is a clean, guaranteed-working search URL:

```
https://www.amazon.com/s?k=<url-encoded brand + model keywords>
```

Fragile `/dp/ASIN` deep links are intentionally avoided because out-of-stock ASINs can 404. `asin` is kept `null` throughout.

## 7. Mock scenes

| `sceneId` | Channel | Returned detections |
| --- | --- | --- |
| `sceneA_watch` | 1 | Fossil Q Hybrid macro watch (box 140,60,830,940) |
| `sceneB_biker` | 2 | biker on the RIGHT: sunglasses (715,310,775,355) + watch (700,470,740,515) + leather jacket (680,380,835,910) |
| `sceneC_recon` | 3 | centered man: sunglasses (300,360,445,450) + jacket (120,575,610,985) |
| `sceneD_omega` | 4 | Omega Seamaster chronograph (300,300,700,720) |

All mock boxes are hand-tuned `0-1000` integers with plausible confidences.

## 8. Embedded Bedrock system prompt

The model is instructed to read real brand/model text off the frame, detect any consumer product, classify into a short lowercase label, report the tightest 0-1000 bounding box, and return ONLY a JSON array of `{ label, displayLabel, x_min, y_min, x_max, y_max, confidence, exactMatch, budgetAlternative }` with no markdown fences.

## 9. Error handling

| Case | Status | Behavior |
| --- | --- | --- |
| No `imageBase64` and not mock-resolvable | 400 | JSON error, no AI call |
| Bedrock failure, fallback enabled | 200 | serve mock |
| Bedrock failure, fallback disabled | 502 | JSON error |
| Unexpected exception | 500 | JSON error, process stays up |

## 10. Testing strategy

- Build gate: `tsc --noEmit` passes for both server and web projects.
- Mock smoke test (`server/smoke.ts`): asserts strict schema, 0-1000 integer boxes, per-channel coordinates, and that every link is a `/s?k=` search URL.
- Live path exercised once real credentials are configured (verify `/health` reports `mode: live`).

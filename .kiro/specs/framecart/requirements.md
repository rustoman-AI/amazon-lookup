# Amazon LookUp - Requirements

> **AI-Powered Shoppable TV X-Ray for Fire TV & Vega OS** - Amazon Developer Hackathon (Fire TV Track + AWS Builder Mini Challenge)

## 1. Introduction

Amazon LookUp turns a paused video frame on Amazon Fire TV and Vega OS into a shoppable overlay. When a viewer pauses a scene, the Fire TV frontend captures the frame and posts it to the Amazon LookUp backend. The backend uses a multimodal vision model on **Amazon Bedrock** (Amazon Nova Pro, with Anthropic Claude 3.5 Sonnet as fallback) to locate shoppable products worn or held by people, then enriches each detection with a verified Amazon product catalog (a real exact match plus a budget "Get the Look" alternative), always linking out via clean Amazon search URLs.

Detections use a **0-1000 integer normalized coordinate space** so the Fire TV frontend can scale boxes to any resolution. A deterministic, `sceneId`-driven **mock mode** lets judges evaluate the full experience instantly with no AWS credentials.

Requirements are written as EARS-style acceptance criteria so AWS Builder judges can trace the Kiro spec-driven workflow from requirement to design to task to code.

## 2. Glossary

| Term | Meaning |
| --- | --- |
| **Frame** | A single paused video image captured by the Fire TV client as a base64 data URL. |
| **Category** | One of the detectable product classes: `watch`, `sunglasses`, `field_watch`, `jacket` (plus free-form labels from live AI). |
| **Bounding box** | Integer rectangle `x_min,y_min,x_max,y_max` in a `0-1000` space; `(0,0)` top-left, `(1000,1000)` bottom-right. |
| **Verified catalog** | A fixed dictionary mapping each category to a real Amazon exact match and budget alternative. |
| **Mock mode** | Deterministic `sceneId`-based detections returned without calling Bedrock. |

## 3. Requirements

### Requirement 1 - Frame analysis endpoint

**User story:** As a Fire TV viewer, I want to pause a scene and instantly see shoppable products, so I can buy items I see on screen.

#### Acceptance criteria

1. WHEN the client sends `POST /api/analyze-frame` with a JSON body containing a non-empty `imageBase64` string THEN the system SHALL respond HTTP 200 with the strict response schema.
2. WHEN the request body omits a usable `imageBase64` AND the request is not resolvable via mock mode THEN the system SHALL respond HTTP 400 with a JSON error.
3. WHEN the request includes `videoTimestamp` THEN the system SHALL echo it in the response `timestamp`; otherwise it SHALL default to `0`.
4. WHEN the request includes `sceneId` THEN the system SHALL use it to select the mock scene and echo it back.
5. WHEN analysis completes THEN the response SHALL include an integer `processingTimeMs` measuring server-side wall-clock time.
6. WHEN the request body is accepted THEN the system SHALL allow JSON payloads up to 10 MB to accommodate base64 frames.

### Requirement 2 - Bedrock vision detection

**User story:** As a product team, I want detections from a real multimodal model on Bedrock, so the demo showcases AWS AI.

#### Acceptance criteria

1. WHEN valid AWS credentials exist AND mock mode is not requested THEN the system SHALL invoke Amazon Bedrock in region `us-east-1` via the Converse API using `@aws-sdk/client-bedrock-runtime`.
2. WHEN invoking Bedrock THEN the system SHALL use model id `us.amazon.nova-pro-v1:0` by default, with `us.anthropic.claude-3-5-sonnet-20241022-v2:0` available as a configurable fallback.
3. WHEN constructing the image content block THEN the system SHALL strip any `data:image/...;base64,` prefix, decode the base64 to raw bytes via `new Uint8Array(Buffer.from(cleanBase64, "base64"))`, and pass `{ image: { format, source: { bytes } } }` - NOT a base64 string.
4. WHEN invoking Bedrock THEN the system SHALL send the embedded system prompt instructing the model to read real brand/model text off the frame and return a JSON array of detections with `exactMatch` and `budgetAlternative`.
5. WHEN the model responds THEN the system SHALL parse the JSON array (tolerating accidental markdown fences) and enrich each detection.
6. WHEN the model returns more than 4 detections THEN the system SHALL keep the top 4 by confidence.

### Requirement 3 - Amazon product links (search URLs)

**User story:** As a viewer, I want tapping a product to open a real, in-stock Amazon listing, so I can actually buy it.

#### Acceptance criteria

1. WHEN a detection maps to a known brand THEN the system SHALL use a curated, high-precision product title and search query.
2. WHEN building any `amazonUrl` THEN the system SHALL produce a clean `https://www.amazon.com/s?k=<url-encoded-keywords>` search URL and SHALL NOT emit fragile `/dp/ASIN` deep links.
3. WHEN a detection label is unknown to the catalog THEN the system SHALL preserve the AI-read title and build a search URL from it.

### Requirement 4 - Coordinate space (0-1000 integers)

**User story:** As a Fire TV frontend developer, I want resolution-independent boxes, so overlays scale to any screen.

#### Acceptance criteria

1. WHEN returning a bounding box THEN all of `x_min,y_min,x_max,y_max` SHALL be integers within `[0, 1000]`.
2. WHEN a box is produced THEN `x_max > x_min` AND `y_max > y_min` SHALL hold.
3. WHEN a model returns out-of-range or non-integer values THEN the system SHALL clamp and round them into valid `0-1000` integers.

### Requirement 5 - Deterministic mock / demo mode

**User story:** As a hackathon judge, I want the app to work instantly without AWS setup, so I can evaluate it immediately.

#### Acceptance criteria

1. WHEN the request carries `mock: true` (body) OR `?mock=true` (query) THEN the system SHALL return deterministic detections and SHALL NOT call Bedrock.
2. WHEN AWS credentials are not configured THEN the system SHALL automatically use mock mode.
3. WHEN `sceneId` is `sceneA_watch` THEN mock mode SHALL return the Channel 1 macro watch detection.
4. WHEN `sceneId` is `sceneB_biker` THEN mock mode SHALL return the Channel 2 biker detections (sunglasses + watch + jacket) framed on the right side.
5. WHEN `sceneId` is `sceneD_omega` THEN mock mode SHALL return the Channel 4 Omega Seamaster detection.
6. WHEN mock mode runs THEN every returned item SHALL be enriched with `/s?k=` search URLs and `0-1000` integer boxes.

### Requirement 6 - Fire TV compatibility, robustness, observability

**User story:** As an operator, I want a lightweight service that fails gracefully, so the demo never crashes.

#### Acceptance criteria

1. WHEN any client issues a cross-origin request (including `OPTIONS` preflight) THEN the system SHALL respond with permissive CORS headers.
2. WHEN the server starts THEN it SHALL bind `0.0.0.0` and listen on port `3001` by default (overridable via `PORT`/`HOST`).
3. WHEN the client requests `GET /health` THEN the system SHALL return HTTP 200 with status, mode (`live`/`mock`), region, and model id.
4. WHEN a live Bedrock invocation fails AND mock fallback is enabled THEN the system SHALL serve deterministic mock detections so the client still receives HTTP 200.
5. WHEN an unexpected error occurs THEN the system SHALL respond HTTP 500 with a JSON error and keep the process alive.
6. WHEN any request is handled THEN the system SHALL log method, path, selected mode, and processing time without logging secrets.

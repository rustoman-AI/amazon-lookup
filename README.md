# Amazon LookUp - AI-Powered Shoppable TV X-Ray for Fire TV & Vega OS

> Amazon Developer Hackathon - Fire TV Track + AWS Builder Mini Challenge

Amazon LookUp turns a **paused video frame** on Amazon Fire TV and Vega OS into a **shoppable overlay**. The Fire TV frontend sends the frame to this backend, which uses a multimodal vision model on **Amazon Bedrock** to locate shoppable fashion products, then enriches each detection with a **verified Amazon product catalog** (exact match + budget "Get the Look" alternative).

Built with the **Kiro spec-driven workflow** - see [`.kiro/specs/framecart/`](.kiro/specs/framecart/) for `requirements.md`, `design.md`, and `tasks.md`.

## Features

- `POST /api/analyze-frame` - single endpoint, strict JSON schema.
- **Amazon Bedrock** Converse API (`us.amazon.nova-pro-v1:0`, fallback Claude 3.5 Sonnet) in `us-east-1`.
- **0-1000 integer coordinate space** for resolution-independent overlays.
- **Verified Amazon catalog** - real brand/model titles with guaranteed-working `https://www.amazon.com/s?k=...` search links.
- **Instant demo / mock mode** - deterministic `sceneId`-driven detections, no AWS setup required.
- CORS enabled, 10 MB JSON limit, port **3001**.

## Quick start

```bash
npm install

# Instant demo - no AWS needed (auto mock mode)
npm run server:dev
# backend on http://localhost:3001

# In a second terminal, start the Fire TV frontend:
npm run dev
# Vite frontend on http://localhost:5173
```

### Try it (mock mode)

```bash
# Channel 1 - Fossil Q Hybrid macro watch
curl -s "http://localhost:3001/api/analyze-frame?mock=true" \
  -H "Content-Type: application/json" \
  -d '{ "sceneId": "sceneA_watch", "videoTimestamp": 42.5 }'

# Channel 2 - biker: sunglasses + watch + leather jacket in one frame
curl -s "http://localhost:3001/api/analyze-frame" \
  -H "Content-Type: application/json" \
  -d '{ "sceneId": "sceneB_biker", "mock": true, "videoTimestamp": 88 }'

# Health
curl -s http://localhost:3001/health
```

### Enable live Bedrock

```bash
cp .env.example .env
# fill in AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (or use a profile / IAM role)
npm run server:dev
```

Send a real frame:

```bash
curl -s http://localhost:3001/api/analyze-frame \
  -H "Content-Type: application/json" \
  -d '{ "imageBase64": "data:image/jpeg;base64,/9j/4AAQ...", "videoTimestamp": 42.5 }'
```

## API

### `POST /api/analyze-frame`

Body: `{ imageBase64?, sceneId?, videoTimestamp?, mock? }` (`?mock=true` query also supported).

Response:

```json
{
  "timestamp": 42.5,
  "sceneId": "sceneA_watch",
  "mode": "mock",
  "processingTimeMs": 12,
  "items": [
    {
      "id": "item_1",
      "label": "watch",
      "displayLabel": "Fossil Q Hybrid Chronograph Smartwatch",
      "category": "watch",
      "confidence": 0.97,
      "x_min": 140, "y_min": 60, "x_max": 830, "y_max": 940,
      "exactMatch": { "title": "...", "asin": null, "estimatedPrice": "$175.00", "amazonUrl": "https://www.amazon.com/s?k=Fossil+Nate+Chronograph+Stainless+Steel+Watch" },
      "budgetAlternative": { "title": "...", "asin": null, "estimatedPrice": "$89.99", "amazonUrl": "https://www.amazon.com/s?k=Casio+Edifice+Chronograph+Stainless+Steel+Watch" }
    }
  ]
}
```

Coordinates are **integers in a 0-1000 space**, origin top-left. Every `amazonUrl` is a clean, guaranteed-working `https://www.amazon.com/s?k=...` search link (no fragile `/dp/ASIN` deep links).

### `GET /health`

```json
{ "status": "ok", "mode": "live", "region": "us-east-1", "model": "us.amazon.nova-pro-v1:0" }
```

## Project layout

The repo holds the Fire TV **frontend** (`src/`, React + Vite) and the Bedrock vision **backend** (`server/`, Express). They are separate TypeScript projects referenced from the root `tsconfig.json`.

```
.kiro/specs/framecart/     requirements.md . design.md . tasks.md
server/                    backend (Express + Bedrock)
  index.ts app.ts config.ts types.ts smoke.ts tsconfig.json
  data/catalog.ts
  lib/      amazonUrl.ts box.ts prompt.ts enrich.ts logger.ts
  services/ bedrockVision.ts mockEngine.ts
  routes/   analyze.ts health.ts
src/                       Fire TV frontend (React + Vite)
dist/                      compiled backend output (server:build)
dist-web/                  compiled frontend output (build)
```

## Scripts (backend vs frontend)

| Command | Description |
| --- | --- |
| `npm run server:dev` | Hot-reload backend dev server (tsx). |
| `npm run server:build` | Compile backend to `dist/`. |
| `npm run server:start` | Run compiled backend (`node dist/index.js`). |
| `npm run server:typecheck` | Backend `tsc --noEmit`. |
| `npm run server:smoke` | Local mock smoke test of all scenes. |
| `npm run dev` | Fire TV frontend (Vite, LAN host). |
| `npm run build` | Build the frontend to `dist-web/`. |

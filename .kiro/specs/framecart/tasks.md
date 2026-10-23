# Amazon LookUp - Implementation Plan

- [x] 1. Scaffold the TypeScript project
  - `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`, `README.md`.
  - Deps: `express`, `cors`, `dotenv`, `@aws-sdk/client-bedrock-runtime`; dev: `typescript`, `tsx`, `@types/*`.
  - _Requirements: 6.2, 1.6_

- [x] 2. Types, config, and verified catalog
  - [x] 2.1 `server/types.ts` - request, raw detection, catalog, and response interfaces.
  - [x] 2.2 `server/config.ts` - env parsing, region `us-east-1`, default + fallback model ids, `hasAwsCredentials()`.
  - [x] 2.3 `server/data/catalog.ts` - verified product dictionary using `/s?k=` search URLs.
  - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [x] 3. Shared libraries
  - [x] 3.1 `server/lib/amazonUrl.ts` - `searchUrl(keywords)` + `dpUrl(asin)` builders.
  - [x] 3.2 `server/lib/box.ts` - clamp/round helpers for 0-1000 integer boxes.
  - [x] 3.3 `server/lib/prompt.ts` - embedded Bedrock system prompt.
  - [x] 3.4 `server/lib/enrich.ts` - map raw detection to enriched item (catalog + box validation, cap 4).
  - [x] 3.5 `server/lib/logger.ts` - tiny structured logger.
  - _Requirements: 2.5, 2.6, 3.1-3.3, 4.1-4.3_

- [x] 4. Mock engine with sceneId scenes
  - `server/services/mockEngine.ts` - Channel 1 Fossil macro, Channel 2 biker (right), Channel 3 recon (centered), Channel 4 Omega.
  - _Requirements: 5.1, 5.3-5.6_

- [x] 5. Bedrock vision client
  - `server/services/bedrockVision.ts` - Converse call, strip data-URL prefix, `Uint8Array` bytes, parse JSON array, fence tolerance.
  - _Requirements: 2.1-2.5_

- [x] 6. Routes and server
  - [x] 6.1 `server/routes/analyze.ts` - validate, resolve mode, call engine, fallback, measure `processingTimeMs`, enrich.
  - [x] 6.2 `server/routes/health.ts` - status, mode, region, model id.
  - [x] 6.3 `server/app.ts` + `server/index.ts` - cors, json(10mb), logger, routes, error handler, bind `0.0.0.0:3001`.
  - _Requirements: 1.1-1.5, 6.1-6.6_

- [x] 7. Fire TV frontend (React + Vite)
  - Live-Bedrock-by-default mode, dynamic LAN backend URL, 0-1000 bounding-box overlay, X-Ray commerce drawer with tier toggle and QR-to-buy.
  - _Requirements: 1.x, 4.x, 5.x_

- [x] 8. Install, build, and smoke test
  - `npm install`, `npm run server:build`, `npm run build`, `npm run server:smoke`, start server, verify `/health` and mock scenes.
  - _Requirements: all_

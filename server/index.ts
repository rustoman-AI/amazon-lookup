/**
 * Amazon LookUp backend bootstrap.
 *
 * Load .env FIRST, before anything reads process.env, so AWS_ACCESS_KEY_ID,
 * AWS_SECRET_ACCESS_KEY, and AWS_REGION are available to the Bedrock SDK.
 */
import 'dotenv/config';

import { createApp } from './app';
import { config, hasAwsCredentials } from './config';
import { logger } from './lib/logger';

const app = createApp();

// Bind to 0.0.0.0 so a physical Fire TV device on the same Wi-Fi/LAN can reach
// the backend at http://<dev-machine-ip>:3001.
const HOST = '0.0.0.0';

app.listen(config.port, HOST, () => {
  const live = hasAwsCredentials();
  const mode = live ? 'LIVE AWS BEDROCK' : 'mock (no AWS credentials)';
  logger.info('server.listening', {
    host: HOST,
    port: config.port,
    mode: live ? 'live' : 'mock',
    region: config.region,
    model: config.modelId,
  });
  // Human-friendly banner for the demo.
  // eslint-disable-next-line no-console
  console.log(
    `\n  Amazon LookUp backend ready\n` +
      `  → local:   http://localhost:${config.port}\n` +
      `  → LAN:     http://<your-lan-ip>:${config.port}  (bound to ${HOST})\n` +
      `  → mode:    ${mode}${live ? ` (${config.modelId})` : ''}\n` +
      `  → region:  ${config.region}\n` +
      `  → routes:  POST /api/analyze-frame   GET /health\n`,
  );
});

/**
 * Environment-driven configuration and runtime mode resolution.
 *
 * Importing `dotenv/config` loads the .env file as a side effect the moment
 * this module is first imported — before `config` below reads process.env.
 */
import 'dotenv/config';

const DEFAULT_MODEL = 'us.amazon.nova-pro-v1:0';
const DEFAULT_FALLBACK_MODEL = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  region: process.env.AWS_REGION ?? 'us-east-1',
  modelId: process.env.BEDROCK_MODEL_ID ?? DEFAULT_MODEL,
  fallbackModelId: process.env.BEDROCK_FALLBACK_MODEL_ID ?? DEFAULT_FALLBACK_MODEL,
  jsonLimit: process.env.JSON_LIMIT ?? '10mb',
  disableMockFallback:
    (process.env.DISABLE_MOCK_FALLBACK ?? 'false').toLowerCase() === 'true',
} as const;

/**
 * True when AWS credentials are available to the SDK credential chain.
 * We treat explicit keys, a named profile, or a container/instance role as "present".
 */
export function hasAwsCredentials(): boolean {
  const hasExplicitKeys = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
  );
  const hasProfile = Boolean(process.env.AWS_PROFILE);
  const hasContainerRole = Boolean(
    process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
      process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI,
  );
  const hasWebIdentity = Boolean(process.env.AWS_WEB_IDENTITY_TOKEN_FILE);
  return hasExplicitKeys || hasProfile || hasContainerRole || hasWebIdentity;
}

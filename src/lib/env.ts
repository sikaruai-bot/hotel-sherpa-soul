import { z } from 'zod';

// Define schema for required environment variables
const EnvSchema = z.object({
  // Rate‑limit window in milliseconds (default 60000 = 1 min)
  RATE_LIMIT_WINDOW_MS: z.string().optional().default('60000'),
  // Default per‑endpoint limits (fallback if ENDPOINT_RATE_LIMITS not set)
  DEFAULT_RATE_LIMIT: z.string().optional().default('500'),
  DEFAULT_BURST: z.string().optional().default('500'),
  // Optional comma‑separated allow‑list of IPs (empty = no whitelist)
  ALLOWED_IPS: z.string().optional().default(''),
  // HMAC secret used by webhook verification
  WEBHOOK_HMAC_SECRET: z.string().min(1, 'WEBHOOK_HMAC_SECRET is required'),
  // JSON mapping of endpoint prefixes to custom limits
  ENDPOINT_RATE_LIMITS: z.string().optional().default('{}'),
});

/**
 * Parse and expose validated environment variables.
 * Throws if required variables are missing or malformed.
 */
export const env = EnvSchema.parse(process.env);

// Helper getters for numeric values
export const RATE_LIMIT_WINDOW_MS = Number(env.RATE_LIMIT_WINDOW_MS);
export const DEFAULT_RATE_LIMIT = Number(env.DEFAULT_RATE_LIMIT);
export const DEFAULT_BURST = Number(env.DEFAULT_BURST);
export const ALLOWED_IPS = env.ALLOWED_IPS ? env.ALLOWED_IPS.split(',').map((s) => s.trim()).filter(Boolean) : [];
export const ENDPOINT_RATE_LIMITS: Record<string, { limit: number; burst?: number }> = (() => {
  try {
    const parsed = JSON.parse(env.ENDPOINT_RATE_LIMITS);
    // Ensure each entry has a numeric limit
    const result: Record<string, { limit: number; burst?: number }> = {};
    for (const key of Object.keys(parsed)) {
      const cfg = parsed[key];
      result[key] = { limit: Number(cfg.limit), burst: cfg.burst ? Number(cfg.burst) : undefined };
    }
    return result;
  } catch (e) {
    console.warn('Failed to parse ENDPOINT_RATE_LIMITS, using empty config.', e);
    return {};
  }
})();

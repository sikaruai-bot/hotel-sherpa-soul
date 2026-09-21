import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory cache for sliding window rate limits
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Extracts client IP address securely across Vercel, Cloudflare, and reverse proxies.
 */
export function getClientIp(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return '127.0.0.1';
}

export interface RateLimitOptions {
  windowMs: number; // e.g. 15 * 60 * 1000 for 15 minutes
  max: number;      // max allowed requests within windowMs
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Checks and increments rate limit for a specific route and IP.
 */
export function checkRateLimit(
  req: Request | NextRequest,
  actionKey: string,
  options: RateLimitOptions = { windowMs: 60 * 1000, max: 20 }
): RateLimitResult {
  const ip = getClientIp(req);
  const key = `${actionKey}:${ip}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      success: true,
      limit: options.max,
      remaining: options.max - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (record.count >= options.max) {
    return {
      success: false,
      limit: options.max,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: options.max,
    remaining: options.max - record.count,
    resetAt: record.resetAt,
  };
}

import { NextResponse, NextRequest } from 'next/server';

// ---------- Rate limiting & IP allow‑list ----------
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const DEFAULT_LIMIT = Number(process.env.DEFAULT_RATE_LIMIT) || 500;
const DEFAULT_BURST = Number(process.env.DEFAULT_BURST) || 500;

// Simple in‑memory fallback (per instance)
const ipRateMap = new Map<string, { count: number; windowStart: number }>();

// Comma‑separated list of allowed IPs (empty = allow all)
const ALLOWED_IPS = process.env.ALLOWED_IPS
  ? process.env.ALLOWED_IPS.split(',').map((s) => s.trim())
  : [];

// ---------- Distributed rate limiting (Upstash Redis) ----------
let redisClient: any = null;
if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('@upstash/redis');
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  } catch (e) {
    console.warn('Upstash Redis client init failed, falling back to memory.', e);
  }
}

// Endpoint‑specific limits configuration (JSON string mapping prefix -> {limit, burst})
const ENDPOINT_LIMITS: Record<string, { limit: number; burst?: number }> = (() => {
  try {
    return JSON.parse(process.env.ENDPOINT_RATE_LIMITS || '{}');
  } catch (e) {
    console.warn('Failed to parse ENDPOINT_RATE_LIMITS, using empty config.', e);
    return {};
  }
})();

// Apply default limits for public endpoints if none are configured
if (Object.keys(ENDPOINT_LIMITS).length === 0) {
  ENDPOINT_LIMITS['/api/public/availability'] = { limit: 60 };
  ENDPOINT_LIMITS['/api/public/bookings'] = { limit: 30 };
}

function getLimitConfig(path: string): { limit: number; burst: number } {
  const matchingKey = Object.keys(ENDPOINT_LIMITS)
    .filter((p) => path.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  const cfg = matchingKey ? ENDPOINT_LIMITS[matchingKey] : null;
  const limit = cfg?.limit ?? DEFAULT_LIMIT;
  const burst = cfg?.burst ?? DEFAULT_BURST;
  return { limit, burst };
}

function logRateLimit(
  ip: string,
  path: string,
  count: number,
  limit: number,
  blocked: boolean
) {
  if (blocked) {
    console.warn(`[RateLimit-BLOCKED] IP=${ip} Path=${path} Count=${count}/${limit}`);
  }
}

async function verifyHmacSignature(secret: string, body: string, signature: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(body));
    const hashArray = Array.from(new Uint8Array(sigBuf));
    const expected = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return expected.toLowerCase() === signature.toLowerCase();
  } catch {
    return false;
  }
}

export async function securityMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // ---- IP allow‑list check (restricted to internal & admin endpoints) ----
  const isRestrictedInternal = path.startsWith('/api/internal') || path.startsWith('/api/admin');
  if (isRestrictedInternal && ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(clientIp)) {
    return new NextResponse('Forbidden: IP not allowed', { status: 403 });
  }

  // ---- Endpoint‑specific rate limiting ----
  const { limit, burst } = getLimitConfig(path);
  let count = 0;

  if (redisClient) {
    const key = `rl:${clientIp}:${path}`;
    count = Number(await redisClient.incr(key));
    await redisClient.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
  } else {
    const record = ipRateMap.get(`${clientIp}:${path}`) ?? {
      count: 0,
      windowStart: Date.now(),
    };
    if (Date.now() - record.windowStart > RATE_LIMIT_WINDOW_MS) {
      record.count = 1;
      record.windowStart = Date.now();
    } else {
      record.count += 1;
    }
    ipRateMap.set(`${clientIp}:${path}`, record);
    count = record.count;
  }

  const blocked = count > limit && count > burst;
  logRateLimit(clientIp, path, count, limit, blocked);
  if (blocked) {
    const retryAfter = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': retryAfter.toString() },
    });
  }

  // ---- Webhook HMAC verification (when signature header is supplied or secret required) ----
  if (request.nextUrl.pathname.startsWith('/api/webhooks')) {
    const signature = request.headers.get('x-hmac-signature');
    const secret = process.env.WEBHOOK_HMAC_SECRET;
    if (signature && secret) {
      const rawBody = await request.clone().text();
      const isValid = await verifyHmacSignature(secret, rawBody, signature);
      if (!isValid) {
        return new NextResponse('Invalid webhook signature', { status: 401 });
      }
    }
  }

  // ---- Security headers ---------------------------------------------------
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'geolocation=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=15768000; includeSubDomains; preload'
  );

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};

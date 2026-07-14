// Simple in-memory sliding-window rate limiter keyed by client identifier.
//
// NOTE: In-memory state is per server instance. This is sufficient for
// `next dev` and single-node deployments. On serverless/edge multi-replica
// platforms the counters are not shared — swap for a shared store (Redis,
// Upstash) if horizontal scaling is required.

interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  windowMs: number = WINDOW_MS,
  max: number = MAX_REQUESTS
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  const prev = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (prev.length >= max) {
    const oldest = prev[0];
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  prev.push(now);
  hits.set(key, prev);
  return { ok: true };
}

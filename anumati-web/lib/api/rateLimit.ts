/**
 * A rate limit for the public API.
 *
 * The endpoints are open by design — the rule base is CC BY 4.0 and the
 * validator is meant to be used by other states — but open is not the same as
 * unlimited. `/standard/validate` parses a body up to 4 MB and `/roadmap` runs
 * a graph algorithm, so a loop from one address could keep a small instance
 * busy for nothing.
 *
 * Deliberately a fixed window in memory: no dependency, no store to run, and
 * it costs one map entry per address. Its limits are honest ones —
 *
 *   - a serverless deployment gives each instance its own map, so the real
 *     ceiling is the limit times the number of warm instances;
 *   - it resets when an instance does.
 *
 * That is enough to stop a script and not enough to stop a determined attacker.
 * A deployment that needs the second thing puts a limiter at the edge, where
 * the traffic already is, rather than counting in application memory.
 */

interface Window {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const hits = new Map<string, Window>();

/** Bounded so a flood of unique addresses cannot grow the map without limit. */
const MAX_TRACKED = 5_000;

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets — what a client should wait. */
  retryAfter: number;
}

export function rateLimit(req: Request, limit: number): RateLimitResult {
  const now = Date.now();
  const key = clientKey(req);

  let w = hits.get(key);
  if (!w || w.resetAt <= now) {
    w = { count: 0, resetAt: now + WINDOW_MS };
    if (hits.size >= MAX_TRACKED) sweep(now);
    hits.set(key, w);
  }

  w.count += 1;
  const retryAfter = Math.max(1, Math.ceil((w.resetAt - now) / 1000));
  return {
    ok: w.count <= limit,
    limit,
    remaining: Math.max(0, limit - w.count),
    retryAfter,
  };
}

/** Headers every answer carries, so a caller can pace itself instead of guessing. */
export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "x-ratelimit-limit": String(r.limit),
    "x-ratelimit-remaining": String(r.remaining),
    ...(r.ok ? {} : { "retry-after": String(r.retryAfter) }),
  };
}

/**
 * The caller's address, as the platform reports it.
 *
 * `x-forwarded-for` can be forged by the client, but on a managed host the
 * proxy overwrites it, and a forged value only ever splits an attacker's own
 * bucket. It is not an identity — nothing is authorised by it.
 */
function clientKey(req: Request): string {
  const h = req.headers;
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "unknown";
}

/** Drop expired windows; if that frees nothing, drop the oldest half. */
function sweep(now: number) {
  for (const [k, w] of hits) if (w.resetAt <= now) hits.delete(k);
  if (hits.size < MAX_TRACKED) return;
  const keys = [...hits.keys()].slice(0, Math.floor(hits.size / 2));
  for (const k of keys) hits.delete(k);
}

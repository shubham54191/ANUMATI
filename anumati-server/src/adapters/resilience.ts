import type { Pool } from "../db";

/**
 * Three behaviours every adapter shares, so one failing government system
 * never takes ANUMATI down with it and never gets the same thing twice:
 *
 *   idempotency  — a call carries a key; a key that already succeeded returns
 *                  the stored answer instead of calling again
 *   retry        — transient failures retry with exponential backoff (the job
 *                  queue retries the whole job on top of this)
 *   circuit      — after repeated failures the adapter stops calling for a
 *                  cool-down and answers "unavailable" at once
 */

export class CircuitOpenError extends Error {
  constructor(public adapter: string, public retryAt: number) {
    super(`${adapter} is unavailable — circuit open until ${new Date(retryAt).toISOString()}`);
  }
}

export class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;
  constructor(
    public name: string,
    private threshold = 5,
    private coolDownMs = 60_000,
  ) {}

  get state(): "closed" | "open" | "half_open" {
    if (this.openUntil === 0) return "closed";
    return Date.now() < this.openUntil ? "open" : "half_open";
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") throw new CircuitOpenError(this.name, this.openUntil);
    try {
      const out = await fn();
      this.failures = 0;
      this.openUntil = 0;
      return out;
    } catch (e) {
      this.failures += 1;
      if (this.failures >= this.threshold) this.openUntil = Date.now() + this.coolDownMs;
      throw e;
    }
  }
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 200): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (e instanceof CircuitOpenError) throw e;
      if (i < attempts - 1) {
        const jitter = Math.random() * baseMs;
        await new Promise((r) => setTimeout(r, baseMs * 2 ** i + jitter));
      }
    }
  }
  throw last;
}

/** Run `fn` at most once successfully per key; record every attempt. */
export async function idempotent<T>(
  pool: Pool,
  adapter: string,
  key: string,
  request: object,
  fn: () => Promise<T>,
): Promise<T> {
  const prior = await pool.query(
    "SELECT status, response FROM integration_call WHERE idempotency_key = $1",
    [key],
  );
  if (prior.rows[0]?.status === "succeeded") return prior.rows[0].response as T;
  await pool.query(
    `INSERT INTO integration_call (idempotency_key, adapter, request, status, attempts)
     VALUES ($1,$2,$3,'pending',0) ON CONFLICT (idempotency_key) DO NOTHING`,
    [key, adapter, JSON.stringify(request)],
  );
  try {
    const out = await fn();
    await pool.query(
      `UPDATE integration_call SET status = 'succeeded', response = $2, attempts = attempts + 1,
         last_error = NULL, updated_at = now() WHERE idempotency_key = $1`,
      [key, JSON.stringify(out ?? null)],
    );
    return out;
  } catch (e) {
    await pool.query(
      `UPDATE integration_call SET status = 'failed', attempts = attempts + 1, last_error = $2,
         updated_at = now() WHERE idempotency_key = $1`,
      [key, (e as Error).message.slice(0, 1000)],
    );
    throw e;
  }
}

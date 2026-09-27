import { z } from "zod";

/**
 * Every setting the service reads, validated once at start-up. A missing or
 * malformed value stops the process with the variable named, instead of
 * surfacing as a confusing failure on the first request.
 */
const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().url(),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),

  /** Signs ANUMATI's own session tokens. At least 32 characters. */
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(8 * 3600),

  /** Comma-separated origins allowed to call the API from a browser. */
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  /**
   * Demo mode seeds the demo accounts and files and enables the two controls a
   * walkthrough needs — advancing the clock and replaying a scripted clash.
   * Never on in production.
   */
  DEMO_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  /** fixture: recorded responses, no network. live: call the real systems. */
  ADAPTER_MODE: z.enum(["fixture", "live"]).default("fixture"),
  APISETU_BASE_URL: z.string().url().optional(),
  APISETU_CLIENT_ID: z.string().optional(),
  APISETU_API_KEY: z.string().optional(),
  MAITRI_BASE_URL: z.string().url().optional(),
  MAITRI_API_KEY: z.string().optional(),
  /** Accept MAITRI 2.0 identity tokens, verified against this key set. */
  MAITRI_JWKS_URL: z.string().url().optional(),
  MAITRI_ISSUER: z.string().optional(),
  MAITRI_AUDIENCE: z.string().optional(),
  /** Client certificate for mutual TLS to department back-offices. */
  DEPT_MTLS_CERT: z.string().optional(),
  DEPT_MTLS_KEY: z.string().optional(),
  DEPT_MTLS_CA: z.string().optional(),
  /** JSON map of department id → endpoint URL, for departments that have one. */
  DEPT_ENDPOINTS: z.string().default("{}"),

  /**
   * demo: a clearly labelled test key signs, so the flow can be shown.
   * external: the officer's own DSC signs outside this service; the API only
   * verifies the signature and records it. The server never holds a key.
   */
  DSC_MODE: z.enum(["demo", "external"]).default("demo"),

  DOCUMENT_STORE_DIR: z.string().default("./var/documents"),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(20 * 1024 * 1024),

  /** Service token the offline extraction pipeline uses to post drafts. */
  EXTRACTION_TOKEN: z.string().min(24).optional(),

  /** Sign-in attempts allowed per client address per minute. */
  LOGIN_RATE_LIMIT: z.coerce.number().int().positive().default(10),

  RULES_VERSION: z.string().default("v1.3"),
  ENGINE_VERSION: z.string().default("8f31c04"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Config = z.infer<typeof Env>;

export function loadConfig(source: Record<string, string | undefined> = process.env): Config {
  const parsed = Env.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid configuration:\n${lines.join("\n")}`);
  }
  const cfg = parsed.data;
  if (cfg.NODE_ENV === "production" && cfg.DEMO_MODE) {
    throw new Error("DEMO_MODE=true is refused when NODE_ENV=production.");
  }
  if (cfg.NODE_ENV === "production" && cfg.DSC_MODE === "demo") {
    throw new Error("DSC_MODE=demo is refused when NODE_ENV=production — the server must not hold a signing key.");
  }
  return cfg;
}

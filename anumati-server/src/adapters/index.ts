import { readFileSync } from "node:fs";
import https from "node:https";
import type { Config } from "../config";
import { CircuitBreaker, withRetry } from "./resilience";
import { FIXTURE_REGISTRY } from "./fixtures";

export interface RegistryAnswer {
  state: "verified" | "mismatch" | "unavailable";
  value: string;
}

export interface Adapters {
  mode: "fixture" | "live";
  breakers: CircuitBreaker[];
  /** API Setu — PAN, CIN, GSTIN, Udyam and DigiLocker, as published there. */
  registry(recordId: string, applicationId: string): Promise<RegistryAnswer>;
  /** Hand a desk its file. Returns the department system's receipt. */
  deliver(departmentId: string, payload: object): Promise<{ receipt: string; channel: string }>;
  /** Status, documents and notifications back through MAITRI 2.0. */
  notify(payload: { application_id: string; kind: string; body: string }): Promise<{ ref: string }>;
}

async function postJson(url: string, body: object, headers: Record<string, string>, agent?: https.Agent) {
  const u = new URL(url);
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const req = https.request(
      {
        method: "POST",
        hostname: u.hostname,
        port: u.port || 443,
        path: `${u.pathname}${u.search}`,
        headers: { "content-type": "application/json", ...headers },
        agent,
        timeout: 15_000,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          let parsed: unknown = data;
          try {
            parsed = JSON.parse(data);
          } catch {
            /* keep text */
          }
          const status = res.statusCode ?? 0;
          if (status >= 500) reject(new Error(`${u.hostname} answered ${status}`));
          else resolve({ status, body: parsed });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error(`${u.hostname} timed out`)));
    req.on("error", reject);
    req.end(JSON.stringify(body));
  });
}

/**
 * fixture mode answers from recorded responses — the demo needs no network and
 * behaves the same every time, including one deliberate registry mismatch.
 * live mode calls the configured endpoints; any it does not have is reported
 * as unavailable rather than guessed.
 */
export function createAdapters(cfg: Config): Adapters {
  const registryBreaker = new CircuitBreaker("api-setu");
  const deptBreaker = new CircuitBreaker("department");
  const maitriBreaker = new CircuitBreaker("maitri");
  const breakers = [registryBreaker, deptBreaker, maitriBreaker];

  if (cfg.ADAPTER_MODE === "fixture") {
    return {
      mode: "fixture",
      breakers,
      async registry(recordId) {
        return registryBreaker.run(async () => FIXTURE_REGISTRY[recordId] ?? { state: "unavailable", value: "No fixture recorded for this check." });
      },
      async deliver(departmentId) {
        return deptBreaker.run(async () => ({
          receipt: `FIXTURE-${departmentId.toUpperCase()}-${Date.now().toString(36)}`,
          channel: "fixture",
        }));
      },
      async notify(p) {
        return maitriBreaker.run(async () => ({ ref: `FIXTURE-NOTIFY-${p.application_id}-${Date.now().toString(36)}` }));
      },
    };
  }

  const endpoints = JSON.parse(cfg.DEPT_ENDPOINTS) as Record<string, string>;
  const mtls =
    cfg.DEPT_MTLS_CERT && cfg.DEPT_MTLS_KEY
      ? new https.Agent({
          cert: readFileSync(cfg.DEPT_MTLS_CERT),
          key: readFileSync(cfg.DEPT_MTLS_KEY),
          ca: cfg.DEPT_MTLS_CA ? readFileSync(cfg.DEPT_MTLS_CA) : undefined,
        })
      : undefined;

  return {
    mode: "live",
    breakers,
    async registry(recordId, applicationId) {
      if (!cfg.APISETU_BASE_URL || !cfg.APISETU_CLIENT_ID || !cfg.APISETU_API_KEY) {
        return { state: "unavailable", value: "API Setu is not configured on this server." };
      }
      return registryBreaker.run(() =>
        withRetry(async () => {
          const res = await postJson(
            `${cfg.APISETU_BASE_URL}/${recordId.toLowerCase()}`,
            { application_id: applicationId },
            { "X-APISETU-CLIENTID": cfg.APISETU_CLIENT_ID!, "X-APISETU-APIKEY": cfg.APISETU_API_KEY! },
          );
          if (res.status >= 400) return { state: "unavailable" as const, value: `API Setu answered ${res.status}` };
          const b = res.body as { status?: string; summary?: string };
          return {
            state: b.status === "MATCH" ? ("verified" as const) : ("mismatch" as const),
            value: b.summary ?? JSON.stringify(b).slice(0, 400),
          };
        }),
      );
    },
    async deliver(departmentId, payload) {
      const url = endpoints[departmentId];
      // No API at this department yet: the officer console is the channel.
      if (!url) return { receipt: `CONSOLE-${departmentId.toUpperCase()}`, channel: "officer-console" };
      return deptBreaker.run(() =>
        withRetry(async () => {
          const res = await postJson(url, payload, {}, mtls);
          if (res.status >= 400) throw new Error(`${departmentId} refused the file: ${res.status}`);
          const b = res.body as { receipt?: string };
          return { receipt: b.receipt ?? `HTTP-${res.status}`, channel: "api" };
        }),
      );
    },
    async notify(p) {
      if (!cfg.MAITRI_BASE_URL || !cfg.MAITRI_API_KEY) return { ref: "LOCAL-ONLY" };
      return maitriBreaker.run(() =>
        withRetry(async () => {
          const res = await postJson(`${cfg.MAITRI_BASE_URL}/notifications`, p, { "x-api-key": cfg.MAITRI_API_KEY! });
          if (res.status >= 400) throw new Error(`MAITRI refused the notification: ${res.status}`);
          return { ref: String((res.body as { id?: string }).id ?? res.status) };
        }),
      );
    },
  };
}

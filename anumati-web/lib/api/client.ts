/**
 * The ANUMATI API, when there is one.
 *
 * Two modes, decided at build time by one variable:
 *
 *   NEXT_PUBLIC_ANUMATI_API unset → demo mode. Everything runs in the browser
 *   on the seeded rule base, exactly as before. Nothing is stored anywhere.
 *
 *   NEXT_PUBLIC_ANUMATI_API=https://… → live mode. Sign-in, files, decisions,
 *   clocks and the ledger all live on the server; the browser still runs the
 *   same engine to draw what the server returns.
 *
 * The screens say which mode they are in. A demo must never be mistaken for
 * the real thing.
 */

export const API_BASE = (process.env.NEXT_PUBLIC_ANUMATI_API ?? "").replace(/\/$/, "");
export const isLive = () => API_BASE.length > 0;

const SESSION_KEY = "anumati.session";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
  }
}

export function sessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? ((JSON.parse(raw) as { token?: string }).token ?? null) : null;
  } catch {
    return null;
  }
}

type Json = Record<string, unknown> | unknown[];

export async function api<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH"; body?: Json | FormData; token?: string | null } = {},
): Promise<T> {
  if (!isLive()) throw new ApiError(0, "demo_mode", "There is no API in demo mode.");
  const token = init.token === undefined ? sessionToken() : init.token;
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (init.body instanceof FormData) body = init.body;
  else if (init.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { method: init.method ?? "GET", headers, body });
  } catch {
    throw new ApiError(0, "network", "Could not reach the ANUMATI server. Check that it is running.");
  }
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string; detail?: unknown } } | null)?.error;
    if (res.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("anumati:unauthorized"));
    }
    throw new ApiError(res.status, e?.code ?? "error", e?.message ?? `Request failed (${res.status}).`, e?.detail);
  }
  return data as T;
}

/**
 * Live updates. The browser cannot send headers on an EventSource, so the
 * token travels as a query parameter on this one endpoint only.
 */
export function subscribe(onFile: (applicationId: string) => void, applicationId?: string): () => void {
  if (!isLive() || typeof window === "undefined") return () => undefined;
  const token = sessionToken();
  if (!token) return () => undefined;
  const q = new URLSearchParams({ token });
  if (applicationId) q.set("application_id", applicationId);
  const es = new EventSource(`${API_BASE}/v1/events?${q.toString()}`);
  es.addEventListener("file", (ev) => {
    try {
      const payload = JSON.parse((ev as MessageEvent).data) as { application_id?: string };
      if (payload.application_id) onFile(payload.application_id);
    } catch {
      /* ignore malformed frames */
    }
  });
  return () => es.close();
}

/** What the server says it is — shown on screen so nobody mistakes a demo. */
export interface ServerMeta {
  rules_version: string | null;
  engine_version: string;
  demo_mode: boolean;
  adapter_mode: "fixture" | "live";
  dsc_mode: "demo" | "external";
  jobs: boolean;
  integrations: { name: string; circuit: string }[];
}

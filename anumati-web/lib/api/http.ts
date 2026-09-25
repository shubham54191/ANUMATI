import { NextResponse } from "next/server";

/**
 * One shape for every response this API gives, success or failure, so a client
 * never has to guess which it got.
 *
 * The API is public and read-mostly: the rule base is published under CC BY 4.0
 * and the validator holds nothing, so responses are CORS-open on purpose. The
 * one write endpoint, /standard/validate, stores nothing.
 */

export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
} as const;

export function ok<T>(data: T, init?: { headers?: Record<string, string> }) {
  return NextResponse.json(data, { status: 200, headers: { ...CORS, ...init?.headers } });
}

export function fail(status: number, code: string, message: string, detail?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(detail === undefined ? {} : { detail }) } },
    { status, headers: CORS },
  );
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Read a JSON body without letting a malformed one become a 500. Returns the
 * parsed value, or a response to send straight back.
 */
export async function readJson(
  req: Request,
  limitBytes = 4_000_000,
): Promise<{ value: unknown } | { response: Response }> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > limitBytes) {
    return {
      response: fail(413, "payload_too_large", `Body must be under ${limitBytes} bytes.`),
    };
  }
  let text: string;
  try {
    text = await req.text();
  } catch {
    return { response: fail(400, "unreadable_body", "The request body could not be read.") };
  }
  if (text.length > limitBytes) {
    return { response: fail(413, "payload_too_large", `Body must be under ${limitBytes} bytes.`) };
  }
  if (text.trim().length === 0) {
    return { response: fail(400, "empty_body", "Send a JSON body.") };
  }
  try {
    return { value: JSON.parse(text) };
  } catch (e) {
    return {
      response: fail(400, "invalid_json", "The body is not valid JSON.", (e as Error).message),
    };
  }
}

/** ISO calendar date, the only date format this API accepts. */
export function isIsoDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

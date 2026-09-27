import { ApiError } from "./client";

/**
 * Every error the person sees says three things: what happened (the server's
 * own words — never replaced by something vaguer), and what to do next. The
 * "why" is usually inside the server's message already; this adds the next
 * step, chosen by the kind of failure, never by guessing at the content.
 */
export interface ExplainedError {
  message: string;
  next: string | null;
}

export function explainError(e: unknown, fallback: string): ExplainedError {
  if (!(e instanceof ApiError)) return { message: fallback, next: "Try again. If it repeats, reload the page." };
  const next = ((): string | null => {
    switch (e.status) {
      case 0:
        return "Check that the ANUMATI server is running and reachable, then try again.";
      case 400:
        return "Nothing was saved. Check the fields — something is missing, too short, too long or in the wrong format.";
      case 401:
        return "Sign in again.";
      case 403:
        return "This action belongs to another role or department. The desk that owns it has to take it.";
      case 404:
        return "Reload — it may have been settled or removed since you opened it.";
      case 409:
        return "Someone changed it while you were working. Reload to see the latest version, then try again.";
      case 413:
        return "Upload a smaller file, or scan at a lower resolution.";
      case 415:
        return "Upload a PDF, PNG or JPEG.";
      case 422:
        return e.code === "prevalidation_failed"
          ? "Fix the gaps listed here, then file again."
          : "Nothing was changed. Do what the message asks first, then try again.";
      case 429:
        return "Too many attempts. Wait a minute, then try again.";
      default:
        return e.status >= 500 ? "Nothing was changed. Try again; if it repeats, report it to the ANUMATI team." : null;
    }
  })();
  return { message: e.message || fallback, next };
}

/** For single-line error slots: "message — next step". */
export function errorLine(e: unknown, fallback: string): string {
  const x = explainError(e, fallback);
  return x.next ? `${x.message} ${x.next}` : x.message;
}

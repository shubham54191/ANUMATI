import { OAGS_SCHEMA } from "@/lib/oags/schema";
import { ok, preflight } from "@/lib/api/http";

/** The schema never changes between requests, so it is generated at build time. */
export const dynamic = "force-static";

export function GET() {
  return ok(OAGS_SCHEMA, {
    headers: {
      "content-type": "application/schema+json",
      "cache-control": "public, max-age=3600",
    },
  });
}

export function OPTIONS() {
  return preflight();
}

import { oagsDocument } from "@/lib/oags/document";
import { fail, isIsoDate, ok, preflight } from "@/lib/api/http";

/** `?as_of=` makes the answer request-dependent, so this is not pre-rendered. */
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const asOf = new URL(req.url).searchParams.get("as_of");
  if (asOf !== null && !isIsoDate(asOf)) {
    return fail(400, "invalid_as_of", "as_of must be a calendar date, YYYY-MM-DD.");
  }

  const doc = oagsDocument(asOf ?? undefined);
  return ok(doc, {
    headers: {
      // A download rather than a wall of JSON in the browser: this endpoint is
      // the one a state actually takes away with them.
      "content-disposition": `attachment; filename="oags-mh-food-${doc.rules_version}.json"`,
    },
  });
}

export function OPTIONS() {
  return preflight();
}

import type { RoadmapRequest } from "@/types/roadmap";
import { buildRoadmap, CyclicDependencyError, DEFAULT_REQUEST } from "@/lib/data/engine";
import { daysUnder, evidenceIndex } from "@/lib/data/observed";
import { SEEDED_REPORTS } from "@/lib/data/fieldReports";
import { APPROVALS } from "@/lib/data/maharashtraFood";
import { RULES_AS_OF, RULES_VERSION } from "@/lib/oags/document";
import { fail, ok, preflight, readJson } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/**
 * Build a roadmap server-side.
 *
 * The same pure engine the browser runs, behind an endpoint, so the answer can
 * be scripted, diffed or handed to another portal without loading the app. The
 * engine is pure and stores nothing, so this route is safe to call repeatedly
 * and returns the same roadmap for the same request.
 */
export async function POST(req: Request) {
  const body = await readJson(req, 64_000);
  if ("response" in body) return body.response;

  const parsed = parseRequest(body.value);
  if ("error" in parsed) return fail(400, "invalid_request", parsed.error);

  const { request, basis } = parsed;

  // The second clock: plan on what applicants reported waiting, not only on
  // what the act allows. Both are honest; they are not the same number.
  const index = evidenceIndex(APPROVALS, SEEDED_REPORTS);
  const daysFor = basis === "observed" ? (a: typeof APPROVALS[number]) => daysUnder(a, "observed", index) : undefined;

  try {
    const roadmap = buildRoadmap(request, undefined, daysFor);
    return ok({
      meta: {
        rules_version: RULES_VERSION,
        rules_as_of: RULES_AS_OF,
        clock: basis,
        generated_at: new Date().toISOString(),
        // Said out loud on every response, because it is the one thing about
        // these numbers a reader could otherwise get wrong.
        basis_note:
          basis === "statutory"
            ? "Sum of notified time limits in series against the critical path. Modelled, not measured."
            : "Median of reported waits, from seeded pilot data. Modelled, not measured.",
      },
      data: roadmap,
    });
  } catch (e) {
    if (e instanceof CyclicDependencyError) {
      // A cycle is a fault in the rule base, not in the caller's request, and
      // it needs a human to break it — so say which approvals are involved.
      return fail(422, "cyclic_rule_base", e.message, { cycle: e.cycle });
    }
    throw e;
  }
}

type Parsed = { request: RoadmapRequest; basis: "statutory" | "observed" } | { error: string };

function parseRequest(raw: unknown): Parsed {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { error: "Send a JSON object." };
  }
  const input = raw as Record<string, unknown>;

  const basis = input.clock ?? "statutory";
  if (basis !== "statutory" && basis !== "observed") {
    return { error: 'clock must be "statutory" or "observed".' };
  }

  const str = (key: keyof RoadmapRequest, fallback: string): string | { error: string } => {
    const v = input[key];
    if (v === undefined) return fallback;
    if (typeof v !== "string" || v.trim() === "") return { error: `${key} must be a non-empty string.` };
    return v;
  };

  const sector = str("sector", DEFAULT_REQUEST.sector);
  if (typeof sector !== "string") return sector;
  const location = str("location", DEFAULT_REQUEST.location);
  if (typeof location !== "string") return location;
  const size_band = str("size_band", DEFAULT_REQUEST.size_band);
  if (typeof size_band !== "string") return size_band;
  const stage = str("stage", DEFAULT_REQUEST.stage);
  if (typeof stage !== "string") return stage;

  let conditions: Record<string, boolean | number> = DEFAULT_REQUEST.conditions;
  if (input.conditions !== undefined) {
    if (typeof input.conditions !== "object" || input.conditions === null || Array.isArray(input.conditions)) {
      return { error: "conditions must be an object of booleans and numbers." };
    }
    const out: Record<string, boolean | number> = {};
    for (const [k, v] of Object.entries(input.conditions as Record<string, unknown>)) {
      if (typeof v !== "boolean" && typeof v !== "number") {
        return { error: `conditions.${k} must be a boolean or a number.` };
      }
      out[k] = v;
    }
    conditions = out;
  }

  return { request: { sector, location, size_band, stage, conditions }, basis };
}

export function OPTIONS() {
  return preflight();
}

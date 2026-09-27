import { APPROVALS } from "@/lib/data/maharashtraFood";
import { inForce, RULES_AS_OF, RULES_VERSION } from "@/lib/oags/document";
import { fail, guard, isIsoDate, ok, preflight } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/**
 * The rule base as it stood on a date.
 *
 * `?as_of=2026-09-07` is the endpoint the product's promise rests on — a
 * roadmap built today must still resolve against today's rules in a year. It
 * also takes `?department=` and `?stage=` because the first thing anyone does
 * with a rule list is narrow it.
 */
export function GET(req: Request) {
  const limited = guard(req, 120);
  if ("response" in limited) return limited.response;

  const q = new URL(req.url).searchParams;

  const asOf = q.get("as_of");
  if (asOf !== null && !isIsoDate(asOf)) {
    return fail(400, "invalid_as_of", "as_of must be a calendar date, YYYY-MM-DD.");
  }

  const stage = q.get("stage");
  if (stage !== null && stage !== "pre_establishment" && stage !== "pre_operation") {
    return fail(400, "invalid_stage", "stage must be pre_establishment or pre_operation.");
  }

  const department = q.get("department")?.trim().toUpperCase() ?? null;

  let rows = APPROVALS;
  if (asOf) rows = rows.filter((a) => inForce(a, asOf));
  if (stage) rows = rows.filter((a) => a.stage === stage);
  if (department) rows = rows.filter((a) => a.department_short.toUpperCase() === department);

  return ok({
    meta: {
      rules_version: RULES_VERSION,
      as_of: asOf ?? RULES_AS_OF,
      count: rows.length,
      total: APPROVALS.length,
      filters: { as_of: asOf, stage, department },
    },
    data: rows,
  }, { headers: limited.headers });
}

export function OPTIONS() {
  return preflight();
}

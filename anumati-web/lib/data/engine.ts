import type { Approval } from "@/types/approval";
import type { Dependency } from "@/types/dependency";
import type { Batch, Roadmap, RoadmapRequest } from "@/types/roadmap";
import { APPROVALS, DEPENDENCIES } from "./maharashtraFood";

export class CyclicDependencyError extends Error {
  constructor(public cycle: string[]) {
    super(`Dependency cycle detected: ${cycle.join(" -> ")}`);
    this.name = "CyclicDependencyError";
  }
}

function applicable(a: Approval, conditions: Record<string, boolean | number>): boolean {
  if (!a.conditional_on) return true;
  // "!key" is the negative case: the approval applies when the condition is
  // NOT set. Land-use conversion is the example — it applies on private land
  // precisely because the land is not already in a notified industrial area.
  if (a.conditional_on.startsWith("!")) {
    return conditions[a.conditional_on.slice(1)] !== true;
  }
  return conditions[a.conditional_on] === true;
}

/**
 * Swap in the authority that actually decides this clearance for this site.
 * The rule is the same everywhere; who applies it is not.
 */
function resolveAuthority(
  a: Approval,
  conditions: Record<string, boolean | number>,
): Approval {
  const variant = a.authority_variants?.find((v) => conditions[v.when] === true);
  if (!variant) return a;
  return {
    ...a,
    department_id: variant.department_id,
    department_name: variant.department_name,
    department_short: variant.department_short,
    source: variant.source,
  };
}

/** Kahn's algorithm. Raises loudly on a cycle rather than looping forever. */
function topoSort(ids: string[], edges: Dependency[]): string[] {
  const indeg = new Map(ids.map((id) => [id, 0]));
  const out = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const e of edges) {
    out.get(e.from_approval_id)!.push(e.to_approval_id);
    indeg.set(e.to_approval_id, (indeg.get(e.to_approval_id) ?? 0) + 1);
  }
  const queue = ids.filter((id) => indeg.get(id) === 0);
  const order: string[] = [];
  while (queue.length) {
    const n = queue.shift()!;
    order.push(n);
    for (const m of out.get(n)!) {
      indeg.set(m, indeg.get(m)! - 1);
      if (indeg.get(m) === 0) queue.push(m);
    }
  }
  if (order.length !== ids.length) {
    throw new CyclicDependencyError(ids.filter((id) => !order.includes(id)));
  }
  return order;
}

/**
 * How long to plan for a single approval. Defaults to the statutory window;
 * the observed clock passes its own resolver so the same CPM runs over what
 * applicants actually waited.
 */
export type DaysResolver = (a: Approval) => number;

export function buildRoadmap(
  request: RoadmapRequest,
  id = "RM-4F2A81",
  daysFor: DaysResolver = (a) => a.statutory_days,
): Roadmap {
  const approvals = APPROVALS.filter(
    (a) => applicable(a, request.conditions) && a.review_status === "published",
  ).map((a) => resolveAuthority(a, request.conditions));
  const live = new Set(approvals.map((a) => a.id));
  const dependencies = DEPENDENCIES.filter(
    (d) => live.has(d.from_approval_id) && live.has(d.to_approval_id),
  );

  const byId = new Map(approvals.map((a) => [a.id, a]));
  const preds = new Map<string, string[]>(approvals.map((a) => [a.id, []]));
  for (const d of dependencies) preds.get(d.to_approval_id)!.push(d.from_approval_id);

  const order = topoSort(Array.from(live), dependencies);

  const earliestStart: Record<string, number> = {};
  const earliestFinish: Record<string, number> = {};
  const predecessor: Record<string, string> = {};

  for (const nodeId of order) {
    const ps = preds.get(nodeId)!;
    const start = ps.length ? Math.max(...ps.map((p) => earliestFinish[p])) : 0;
    if (ps.length) {
      predecessor[nodeId] = ps.reduce((best, p) =>
        earliestFinish[p] > earliestFinish[best] ? p : best,
      );
    }
    earliestStart[nodeId] = start;
    earliestFinish[nodeId] = start + daysFor(byId.get(nodeId)!);
  }

  const optimised = Math.max(...Object.values(earliestFinish));
  const endNode = Object.keys(earliestFinish).reduce((best, k) =>
    earliestFinish[k] > earliestFinish[best] ? k : best,
  );

  const path: string[] = [];
  let cursor: string | undefined = endNode;
  while (cursor) {
    path.push(cursor);
    cursor = predecessor[cursor];
  }
  path.reverse();

  // Group by earliest possible START day — these run in parallel.
  const grouped = new Map<number, string[]>();
  for (const nodeId of Array.from(live)) {
    const day = earliestStart[nodeId];
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(nodeId);
  }
  const batches: Batch[] = Array.from(grouped.entries())
    .sort((x, y) => x[0] - y[0])
    .map(([day, ids]: [number, string[]]) => ({
      day,
      // Critical-path members sort first: column 0 is reserved for the red spine.
      approvals: ids.sort((p, q) => {
        const pc = path.includes(p) ? 0 : 1;
        const qc = path.includes(q) ? 0 : 1;
        return pc - qc || p.localeCompare(q);
      }),
    }));

  const sequential = approvals.reduce((s, a) => s + daysFor(a), 0);

  return {
    id,
    request,
    approvals,
    dependencies,
    batches,
    critical_path: path,
    sequential_days: sequential,
    optimised_days: optimised,
    earliest_finish: earliestFinish,
  };
}

export const DEFAULT_REQUEST: RoadmapRequest = {
  sector: "food",
  location: "pune_chakan",
  size_band: "medium",
  stage: "new",
  conditions: {
    midc_land: true,
    boiler: true,
    height: false,
    hazardous: true,
    export: true,
    contract_labour: true,
    factory: true,
    epf_esic: true,
  },
};

import type { Lever, LeverImpact } from "@/types/simulation";
import type { Roadmap } from "@/types/roadmap";
import { EDGE_SPEC } from "@/lib/constants/edgeTypes";

export class IllegalLeverError extends Error {}

export const LEVERS: Lever[] = [
  { id: "L1", kind: "parallelise", from_id: "A10", to_id: "A15",
    label: "Parallelise Building plan to Consent to Establish",
    rationale: "Drops one documentary edge. MPCB screening starts on the submitted plan; final consent still needs the sanction." },
  { id: "L2", kind: "reduce_timeline", approval_id: "A15", new_days: 30,
    label: "Reduce MPCB Consent to Establish, 60 to 30 days",
    rationale: "Matches the service norm already met in three other states." },
  { id: "L3", kind: "reduce_timeline", approval_id: "A01", new_days: 30,
    label: "Reduce NA / land-use conversion, 60 to 30 days",
    rationale: "The first approval in the chain. Every day cut here moves the whole journey forward." },
  { id: "L4", kind: "enforce_deemed", approval_id: "A10",
    label: "Honour the MRTP deeming clause on Building plan",
    rationale: "MRTP Act s. 45(5) already deems a building permission granted if no decision issues in time. The clause exists; it is simply not honoured." },
  { id: "L5", kind: "reduce_timeline", approval_id: "A24", new_days: 30,
    label: "Reduce FSSAI Central Licence, 45 to 30 days",
    rationale: "Last approval on the critical path, so the saving passes straight through to the finish date." },
  { id: "L6", kind: "parallelise", from_id: "A21", to_id: "A24",
    label: "Drop practice edge: Factory licence to FSSAI",
    rationale: "A convention, not a rule. Removing it is correct — and it may buy nothing." },
  { id: "L7", kind: "reduce_timeline", approval_id: "A13", new_days: 10,
    label: "Reduce Fire NOC (provisional), 21 to 10 days",
    rationale: "Reported as a bottleneck. Whether it helps depends on the critical path, not on the complaint." },
  { id: "L8", kind: "parallelise", from_id: "A01", to_id: "A10",
    label: "Parallelise NA permission to Building plan approval",
    rationale: "Sanctioned NA is a statutory precondition for a building plan." },
];

function totalWith(roadmap: Roadmap, lever: Lever): number {
  // Plan with the days the roadmap was actually built on, not always the
  // statutory ones — under the observed clock those are different numbers and
  // a simulator that silently answers the statutory question is worse than no
  // simulator. earliest_finish minus the batch start is that figure.
  const startOf = new Map<string, number>();
  for (const b of roadmap.batches) for (const id of b.approvals) startOf.set(id, b.day);
  const days = new Map(
    roadmap.approvals.map((a) => [
      a.id,
      (roadmap.earliest_finish[a.id] ?? a.statutory_days) - (startOf.get(a.id) ?? 0),
    ]),
  );
  let edges = roadmap.dependencies;

  switch (lever.kind) {
    case "reduce_timeline":
      days.set(lever.approval_id!, lever.new_days!);
      break;
    case "enforce_deemed": {
      const a = roadmap.approvals.find((x) => x.id === lever.approval_id);
      if (a?.deemed_days) days.set(a.id, Math.min(a.statutory_days, a.deemed_days));
      break;
    }
    case "remove_approval":
      days.set(lever.approval_id!, 0);
      break;
    case "parallelise": {
      const edge = roadmap.dependencies.find(
        (d) => d.from_approval_id === lever.from_id && d.to_approval_id === lever.to_id,
      );
      if (!edge) throw new IllegalLeverError("No such dependency");
      if (!EDGE_SPEC[edge.edge_type].removable) {
        throw new IllegalLeverError("Cannot parallelise a statutory dependency");
      }
      edges = roadmap.dependencies.filter((d) => d !== edge);
      break;
    }
  }

  const preds = new Map<string, string[]>(roadmap.approvals.map((a) => [a.id, []]));
  for (const e of edges) preds.get(e.to_approval_id)?.push(e.from_approval_id);

  const finish = new Map<string, number>();
  const visit = (id: string): number => {
    const cached = finish.get(id);
    if (cached !== undefined) return cached;
    finish.set(id, 0);
    const start = (preds.get(id) ?? []).reduce((m, p) => Math.max(m, visit(p)), 0);
    const value = start + (days.get(id) ?? 0);
    finish.set(id, value);
    return value;
  };
  return roadmap.approvals.reduce((m, a) => Math.max(m, visit(a.id)), 0);
}

export function runSimulation(roadmap: Roadmap, levers: Lever[] = LEVERS): LeverImpact[] {
  const baseline = roadmap.optimised_days;
  return levers
    .map((lever): LeverImpact => {
      try {
        const newTotal = totalWith(roadmap, lever);
        return { lever, new_total: newTotal, days_saved: baseline - newTotal };
      } catch (e) {
        return {
          lever,
          new_total: null,
          days_saved: null,
          illegal: true,
          reason: e instanceof Error ? e.message : "refused",
        };
      }
    })
    .sort((a, b) => (b.days_saved ?? -1) - (a.days_saved ?? -1));
}

export function totalWithMany(roadmap: Roadmap, chosen: Lever[]): number {
  let working = roadmap;
  for (const lever of chosen) {
    if (lever.kind !== "parallelise") continue;
    const edge = working.dependencies.find(
      (d) => d.from_approval_id === lever.from_id && d.to_approval_id === lever.to_id,
    );
    if (edge && EDGE_SPEC[edge.edge_type].removable) {
      working = { ...working, dependencies: working.dependencies.filter((d) => d !== edge) };
    }
  }
  const days = new Map(working.approvals.map((a) => [a.id, a.statutory_days]));
  for (const lever of chosen) {
    if (lever.kind === "reduce_timeline") days.set(lever.approval_id!, lever.new_days!);
    if (lever.kind === "enforce_deemed") {
      const a = working.approvals.find((x) => x.id === lever.approval_id);
      if (a?.deemed_days) days.set(a.id, Math.min(days.get(a.id)!, a.deemed_days));
    }
  }
  const preds = new Map<string, string[]>(working.approvals.map((a) => [a.id, []]));
  for (const e of working.dependencies) preds.get(e.to_approval_id)?.push(e.from_approval_id);
  const finish = new Map<string, number>();
  const visit = (id: string): number => {
    const c = finish.get(id);
    if (c !== undefined) return c;
    finish.set(id, 0);
    const start = (preds.get(id) ?? []).reduce((m, p) => Math.max(m, visit(p)), 0);
    const v = start + (days.get(id) ?? 0);
    finish.set(id, v);
    return v;
  };
  return working.approvals.reduce((m, a) => Math.max(m, visit(a.id)), 0);
}

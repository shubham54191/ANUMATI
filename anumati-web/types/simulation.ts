export type LeverKind =
  | "reduce_timeline"
  | "parallelise"
  | "enforce_deemed"
  | "remove_approval";

export interface Lever {
  id: string;
  kind: LeverKind;
  label: string;
  rationale: string;
  approval_id?: string;
  from_id?: string;
  to_id?: string;
  new_days?: number;
}

export interface LeverImpact {
  lever: Lever;
  new_total: number | null;
  days_saved: number | null;

  illegal?: boolean;
  reason?: string;
}

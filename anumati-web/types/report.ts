/**
 * What actually happened at the counter.
 *
 * Everything else in the rule base is normative — what an Act says should
 * happen. This is the other kind of fact: what an applicant experienced. The
 * two are kept in different types on purpose, because they have completely
 * different warrants. A statutory day count is true because a section says so;
 * an observed day count is true only to the extent that enough people reported
 * it, which is why every aggregate here carries its sample size.
 */

export type ReportKind =
  | "extra_document"
  | "not_required"
  | "wrong_order"
  | "longer";

export const REPORT_KIND_LABEL: Record<ReportKind, string> = {
  extra_document: "Asked for a document not on the list",
  not_required: "This approval was not required at all",
  wrong_order: "The order was different in practice",
  longer: "It took materially longer than stated",
};

export interface FieldReport {
  id: string;
  approval_id: string;
  kind: ReportKind;
  /** Days the applicant actually waited. Only timing reports carry one. */
  observed_days: number | null;
  detail: string;
  reported_on: string;
  district: string;
  /**
   * Seeded rows are illustrative pilot data shipped with the build; filed rows
   * were entered in this session. The screen says which, always — an observed
   * median is only as good as what it was computed from.
   */
  origin: "seeded" | "filed";
  status: "new" | "under_review" | "accepted";
}

/** Everything reported against one approval, rolled up. */
export interface ApprovalEvidence {
  approval_id: string;
  statutory_days: number;
  /** Median of the timing reports, or null where nobody has reported one. */
  observed_days: number | null;
  /** How many timing reports the median rests on. */
  sample: number;
  /** observed − statutory. Positive means reality is slower than the law. */
  delta: number | null;
  extra_document: number;
  not_required: number;
  wrong_order: number;
  reports: FieldReport[];
  /** True while every report behind the median is shipped demo data. */
  seeded_only: boolean;
}

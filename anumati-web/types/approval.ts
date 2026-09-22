export type ReviewStatus = "draft" | "in_review" | "published";

export type Stage = "pre_establishment" | "pre_operation";

export interface SourceRef {
  document_id: string;
  section: string;
  url: string;

  effective_from: string;
  effective_to: string | null;
}

export interface Approval {

  id: string;
  name: string;
  department_id: string;
  department_name: string;

  department_short: string;
  stage: Stage;

  name_mr?: string;
  statutory_days: number;
  deemed_exists: boolean;
  deemed_days: number | null;
  deemed_reference: string | null;
  required_documents: string[];
  produces_document: string | null;

  /**
   * Condition key that must be true for this approval to apply. Prefix with
   * "!" for the negative case — "!midc_land" means "only on private land".
   */
  conditional_on: string | null;
  /**
   * Some clearances are decided by a different authority depending on where
   * the land is. Inside a notified MIDC area, MIDC is the Special Planning
   * Authority and PMRDA never sees the building plan. The clearance is the
   * same; the desk is not.
   */
  authority_variants?: {
    when: string;
    department_id: string;
    department_name: string;
    department_short: string;
    source: SourceRef;
  }[];
  confidence: number;
  review_status: ReviewStatus;

  flagged?: boolean;
  source: SourceRef;
  verified_by: string | null;
  verified_on: string | null;
  version: string;
}

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

  conditional_on: string | null;
  confidence: number;
  review_status: ReviewStatus;

  flagged?: boolean;
  source: SourceRef;
  verified_by: string | null;
  verified_on: string | null;
  version: string;
}

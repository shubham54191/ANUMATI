import type { ApprovalReadiness, Dossier, Gap } from "@/types/compliance";
import type { FileView } from "@/store/useMatrixStore";

export interface CommonForm {
  plot_number?: string;
  built_up_sqm?: number;
  connected_load_kva?: number;
  water_draw_kld?: number;
  employees?: number;
  investment_lakh?: number;
  pan?: string;
  gstin?: string;
}

export type ApplicationStatus = "draft" | "submitted" | "returned" | "cleared" | "closed" | string;

export interface ApplicationSummary {
  id: string;
  project: string;
  applicant_name?: string;
  status: ApplicationStatus;
  roadmap_id: string | null;
  filed_at: string | null;
  created_at: string;
}

export interface StoredDocument {
  kind: string;
  original_name: string;
  sha256: string;
  source: string | null;
  uploaded_at: string;
  byte_size: number;
  mime: string;
}

export interface GrievanceRow {
  id: string;
  application_id: string;
  approval_id: string;
  dept_short: string;
  reason: string;
  days_pending: number;
  status: "open" | "acknowledged" | "resolved";
  raised_at: string;
  resolved_at: string | null;
  resolution: string | null;
}

export interface PrevalidationSummary {
  total: number;
  ready: number;
  blocked: number;
  blocking_gaps: number;
  advisory_gaps: number;
  current_wave: number;
  current_wave_blocked: number;
  submittable: boolean;
}

export type SubmissionGap = Gap & { approval_id: string; department_short: string };

export interface ApplicationDetail {
  application: {
    id: string;
    project: string;
    applicant_name: string;
    sector: string;
    location: string;
    status: ApplicationStatus;
    roadmap_id: string | null;
    common_form: CommonForm;
    dossier: Dossier;
    rules_version: string;
    engine_version: string;
    filed_at: string | null;
    created_at: string;
  };
  readiness: ApprovalReadiness[];
  summary: PrevalidationSummary;
  submission_gaps: SubmissionGap[];
  documents: StoredDocument[];
  grievances: GrievanceRow[];
  file: FileView | null;
}

/** SHA-256 of a file, in the browser, before it is sent — so the receipt can be checked. */
export async function sha256Hex(file: Blob): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

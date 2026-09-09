export const EDGE_TYPES = ["statutory", "documentary", "physical", "practice"] as const;
export type EdgeType = (typeof EDGE_TYPES)[number];

export interface Dependency {
  from_approval_id: string;
  to_approval_id: string;
  edge_type: EdgeType;
  confidence: number;

  rationale: string;

  evidence_document: string | null;
  condition: string | null;
  source: { document_id: string; section: string; url: string };
}

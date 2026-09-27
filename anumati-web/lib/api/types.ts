/** Shapes the ANUMATI API returns, where the browser reads them directly. */

export interface LedgerRow {
  seq: number;
  at: string;
  actor: string;
  actor_id: string | null;
  kind: string;
  application_id: string | null;
  approval_id: string | null;
  inputs: unknown;
  outputs: unknown;
  rules_version: string | null;
  engine_version: string | null;
  document_sha256: string | null;
  signature_ref: string | null;
  prev_hash: string;
  row_hash: string;
}

export interface VerifyResult {
  ok: boolean;
  checked: number;
  head: { seq: number; hash: string } | null;
  first_break: { seq: number; reason: string; expected: string; found: string } | null;
  anchors: { day: string; ok: boolean }[];
}

export interface SignatureRow {
  id: string;
  approval_id: string;
  dept_id: string;
  mode: "demo" | "dsc";
  algorithm: string;
  certificate: string;
  serial: string;
  document_sha256: string;
  signed_at: string;
  valid: boolean;
}

export interface SignResult {
  signature_id: string;
  signed_at: string;
  document_sha256: string;
  mode: "demo" | "dsc";
  certificate: string;
  warning: string | null;
}

import type { Roadmap } from "@/types/roadmap";
import type { Approval } from "@/types/approval";

export type DocOrigin = "state_issued" | "applicant";

export interface DocumentConsumer {
  approval_id: string;
  approval_name: string;
  department_name: string;
  department_short: string;

  asked_on_day: number;
}

export interface DocumentRow {

  name: string;

  key: string;
  origin: DocOrigin;

  producer: {
    approval_id: string;
    approval_name: string;
    department_name: string;

    issued_on_day: number;
  } | null;
  consumers: DocumentConsumer[];

  asks: number;

  departments: number;

  avoidable: number;
}

export interface DocumentLedger {
  rows: DocumentRow[];

  total_asks: number;
  unique_documents: number;

  state_issued_asks: number;

  avoidable_asks: number;

  departments_asking: number;

  worst: DocumentRow | null;
}

const norm = (s: string) => s.trim().toLowerCase();

export function buildDocumentLedger(roadmap: Roadmap): DocumentLedger {
  const byId = new Map(roadmap.approvals.map((a) => [a.id, a]));

  const producers = new Map<string, Approval>();
  for (const a of roadmap.approvals) {
    if (a.produces_document) producers.set(norm(a.produces_document), a);
  }

  const rows = new Map<string, DocumentRow>();

  for (const a of roadmap.approvals) {
    for (const raw of a.required_documents) {
      const key = norm(raw);
      const finish = roadmap.earliest_finish[a.id] ?? 0;

      let row = rows.get(key);
      if (!row) {
        const p = producers.get(key);
        row = {
          name: raw,
          key,
          origin: p ? "state_issued" : "applicant",
          producer: p
            ? {
                approval_id: p.id,
                approval_name: p.name,
                department_name: p.department_name,
                issued_on_day: roadmap.earliest_finish[p.id] ?? 0,
              }
            : null,
          consumers: [],
          asks: 0,
          departments: 0,
          avoidable: 0,
        };
        rows.set(key, row);
      }

      row.consumers.push({
        approval_id: a.id,
        approval_name: a.name,
        department_name: a.department_name,
        department_short: a.department_short,
        asked_on_day: Math.max(0, finish - a.statutory_days),
      });
    }
  }

  const list = [...rows.values()];
  for (const row of list) {
    row.consumers.sort((x, y) => x.asked_on_day - y.asked_on_day);
    row.asks = row.consumers.length;
    row.departments = new Set(row.consumers.map((c) => c.department_name)).size;
    row.avoidable = row.origin === "state_issued" ? row.asks : Math.max(0, row.asks - 1);
  }

  list.sort(
    (a, b) =>
      b.avoidable - a.avoidable ||
      b.asks - a.asks ||
      b.departments - a.departments ||
      a.name.localeCompare(b.name),
  );

  const total_asks = list.reduce((n, r) => n + r.asks, 0);
  const state_issued_asks = list
    .filter((r) => r.origin === "state_issued")
    .reduce((n, r) => n + r.asks, 0);
  const avoidable_asks = list.reduce((n, r) => n + r.avoidable, 0);

  const askingDepartments = new Set<string>();
  for (const a of roadmap.approvals) {
    if (a.required_documents.length > 0) askingDepartments.add(a.department_name);
  }

  void byId;

  return {
    rows: list,
    total_asks,
    unique_documents: list.length,
    state_issued_asks,
    avoidable_asks,
    departments_asking: askingDepartments.size,
    worst: list.find((r) => r.avoidable > 0) ?? null,
  };
}

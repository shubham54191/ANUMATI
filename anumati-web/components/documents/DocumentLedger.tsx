"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import type { Roadmap } from "@/types/roadmap";
import { buildDocumentLedger, type DocumentRow } from "@/lib/graph/documentReuse";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    id: "state_issued" as const,
    title: "The state is asking for its own paper",
    blurb:
      "Another department in this same roadmap issues this document. The applicant is carrying it back to a counter that could look it up.",
  },
  {
    id: "applicant" as const,
    title: "Uploaded once, asked for again",
    blurb:
      "These come from outside the roadmap, so the first upload is unavoidable. Every ask after it is a re-verification.",
  },
];

function CounterChip({
  id,
  day,
  title,
}: {
  id: string;
  day: number;
  title: string;
}) {
  return (
    <span
      title={title}
      className="font-num inline-flex h-[19px] items-center gap-1 rounded-sm border border-line bg-bg px-1.5 font-mono text-[10.5px] text-ink"
    >
      {id}
      <span className="text-faint">d{day}</span>
    </span>
  );
}

function Row({ row, index }: { row: DocumentRow; index: number }) {
  const select = useRoadmapStore((s) => s.select);
  const selectedId = useRoadmapStore((s) => s.selectedApprovalId);
  const producerId = row.producer?.approval_id;

  return (
    <div
      role="row"
      data-document={row.key}
      className="flex items-start gap-4 border-b border-line py-3 pl-2.5"
    >
      <span
        role="cell"
        className="font-num w-8 flex-none pt-0.5 font-mono text-[11.5px] text-faint"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <span role="cell" className="flex-1">
        <span className="block text-[13.5px] font-medium leading-snug text-ink">{row.name}</span>
        {row.producer ? (
          <span className="mt-1 flex items-center gap-1.5 text-[11.5px] leading-snug text-muted">
            Issued by
            <button
              onClick={() => select(producerId === selectedId ? null : producerId!)}
              className={cn(
                "font-mono text-[11px] underline-offset-2 hover:underline",
                "text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              )}
            >
              {row.producer.approval_id}
            </button>
            · {row.producer.department_name} · available day {row.producer.issued_on_day}
          </span>
        ) : (
          <span className="mt-1 block text-[11.5px] leading-snug text-muted">
            Comes from outside this roadmap — the applicant supplies it
          </span>
        )}
      </span>

      <span role="cell" className="flex w-[300px] flex-none flex-wrap gap-1 pt-0.5">
        {row.consumers.map((c) => (
          <CounterChip
            key={c.approval_id}
            id={c.approval_id}
            day={c.asked_on_day}
            title={`${c.approval_id} · ${c.approval_name} — ${c.department_name}, asked on day ${c.asked_on_day}`}
          />
        ))}
      </span>

      <span
        role="cell"
        className="font-num w-[92px] flex-none pt-0.5 text-right font-mono text-[12.5px] text-ink"
      >
        {row.asks} <span className="text-faint">asks</span>
        <span className="mt-0.5 block text-[10.5px] text-faint">
          {row.departments} {row.departments === 1 ? "dept" : "depts"}
        </span>
      </span>

      <span
        role="cell"
        className="font-num w-[104px] flex-none pt-0.5 text-right font-mono text-[12.5px] font-semibold text-accent-secondary"
      >
        −{row.avoidable}
      </span>
    </div>
  );
}

export function DocumentLedger({ roadmap }: { roadmap: Roadmap }) {
  const [query, setQuery] = useState("");
  const ledger = useMemo(() => buildDocumentLedger(roadmap), [roadmap]);

  const q = query.trim().toLowerCase();
  const visible = ledger.rows.filter(
    (r) =>
      r.avoidable > 0 &&
      (!q ||
        r.name.toLowerCase().includes(q) ||
        r.producer?.department_name.toLowerCase().includes(q) ||
        r.consumers.some((c) => c.department_name.toLowerCase().includes(q))),
  );

  const askedOnce = ledger.rows.length - ledger.rows.filter((r) => r.avoidable > 0).length;
  const pct = ledger.total_asks
    ? Math.round((ledger.avoidable_asks / ledger.total_asks) * 100)
    : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg">
      {/* the argument, in one band */}
      <div className="flex flex-none items-center gap-7 border-b border-line bg-sunk px-5 py-3.5">
        <div className="flex flex-col gap-0.5">
          <Label>Document asks</Label>
          <div className="flex items-baseline gap-1.5">
            <span className="font-num font-serif text-[30px] leading-none text-ink">
              {ledger.total_asks}
            </span>
            <span className="text-[11.5px] text-muted">
              across {ledger.departments_asking} departments
            </span>
          </div>
        </div>

        <span className="h-9 w-px bg-line" />

        <div className="flex flex-col gap-0.5">
          <Label>Distinct documents</Label>
          <div className="flex items-baseline gap-1.5">
            <span className="font-num font-serif text-[30px] leading-none text-muted">
              {ledger.unique_documents}
            </span>
          </div>
        </div>

        <span className="h-9 w-px bg-line" />

        <div className="flex flex-col gap-0.5">
          <Label className="text-accent">State already holds</Label>
          <div className="flex items-baseline gap-1.5">
            <span className="font-num font-serif text-[30px] leading-none text-accent">
              {ledger.state_issued_asks}
            </span>
            <span className="text-[11.5px] text-muted">of those asks</span>
          </div>
        </div>

        <span className="h-9 w-px bg-line" />

        <div className="flex flex-col gap-0.5">
          <Label className="text-accent-secondary">A verified link would remove</Label>
          <div className="flex items-baseline gap-1.5">
            <span className="font-num font-serif text-[30px] leading-none text-accent-secondary">
              {ledger.avoidable_asks}
            </span>
            <span className="font-num font-mono text-[11px] text-faint">−{pct}%</span>
          </div>
        </div>

        <div className="flex-1" />

        {ledger.worst ? (
          <p className="max-w-[280px] text-[11.5px] leading-relaxed text-muted">
            Worst offender:{" "}
            <span className="font-medium text-ink">{ledger.worst.name}</span> — asked at{" "}
            {ledger.worst.asks} counters across {ledger.worst.departments} departments.
          </p>
        ) : null}
      </div>

      {/* filter */}
      <div className="flex h-[52px] flex-none items-center gap-3 border-b border-line bg-surface px-5">
        <label className="flex h-8 w-[320px] items-center gap-2 rounded border border-control bg-bg px-3 focus-within:ring-2 focus-within:ring-accent">
          <Search className="h-3.5 w-3.5 flex-none text-faint" strokeWidth={1.4} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by document or department"
            aria-label="Filter the document ledger"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
          />
        </label>
        <span className="font-num font-mono text-[11.5px] text-muted">
          {visible.length} duplicated · {askedOnce} asked once only
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <EmptyState
            title={q ? "Nothing matches that" : "No duplicated documents"}
            body={
              q
                ? "Try a document name, or a department such as MPCB."
                : "Every document in this roadmap is asked for exactly once. Nothing to reclaim here."
            }
            action={q ? <Button onClick={() => setQuery("")}>Clear the filter</Button> : undefined}
          />
        ) : null}

        {SECTIONS.map((section) => {
          const rows = visible.filter((r) => r.origin === section.id);
          if (rows.length === 0) return null;
          const asks = rows.reduce((n, r) => n + r.asks, 0);
          const avoidable = rows.reduce((n, r) => n + r.avoidable, 0);

          return (
            <section key={section.id}>
              <header className="sticky top-0 z-10 flex items-baseline gap-4 border-b border-line bg-sunk px-5 py-3">
                <h2 className="font-serif text-[19px] font-medium text-ink">{section.title}</h2>
                <span className="font-num font-mono text-[11px] text-muted">
                  {rows.length} documents · {asks} asks ·{" "}
                  <span className="text-accent-secondary">{avoidable} removable</span>
                </span>
                <span className="hidden max-w-[520px] text-[12px] text-muted lg:inline">
                  {section.blurb}
                </span>
              </header>

              <div role="table" aria-label={section.title} className="px-5">
                <div
                  role="row"
                  className="flex items-center gap-4 border-b border-line py-2 pl-2.5 text-faint"
                >
                  <span role="columnheader" className="label w-8 flex-none">
                    #
                  </span>
                  <span role="columnheader" className="label flex-1">
                    Document and where it comes from
                  </span>
                  <span role="columnheader" className="label w-[300px] flex-none">
                    Counters that ask for it
                  </span>
                  <span role="columnheader" className="label w-[92px] flex-none text-right">
                    Total
                  </span>
                  <span role="columnheader" className="label w-[104px] flex-none text-right">
                    Removable
                  </span>
                </div>

                {rows.map((r, i) => (
                  <Row key={r.key} row={r} index={i} />
                ))}
              </div>
            </section>
          );
        })}

        <footer className="px-5 py-5">
          <Label className="mb-2 block">What this screen is and is not</Label>
          <p className="max-w-3xl text-[12px] leading-relaxed text-muted">
            This is a measurement, not a registry. ANUMATI does not verify documents and does not
            hold them — DigiLocker and the issuing departments already do that. What has been
            missing is the list of asks worth switching off, and that falls out of the rule base:
            if an approval declares the document it produces, and another approval declares that
            same document as a requirement, the second ask is answerable by lookup. Removable
            counts every ask against a state-issued document, and every ask after the first against
            a document the applicant supplies.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted">
            <ArrowRight className="h-3 w-3 flex-none text-faint" strokeWidth={1.5} />
            Day numbers show when each counter asks, so a department can see whether the document
            even exists yet at the moment it is demanded.
          </p>
        </footer>
      </div>
    </div>
  );
}

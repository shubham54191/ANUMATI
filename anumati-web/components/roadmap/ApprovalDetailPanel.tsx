"use client";
import { useState } from "react";
import { X, TriangleAlert } from "lucide-react";
import type { Roadmap } from "@/types/roadmap";
import type { ApprovalEvidence } from "@/types/report";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { Badge, ConfidenceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { EvidenceBlock } from "./EvidenceBlock";
import { ProvenanceBlock } from "./ProvenanceBlock";
import { Dialog } from "@/components/ui/Dialog";
import { ReportRejectionDialog } from "./ReportRejectionDialog";

export function ApprovalDetailPanel({
  roadmap,
  evidence,
}: {
  roadmap: Roadmap;
  evidence: Record<string, ApprovalEvidence>;
}) {
  const selectedId = useRoadmapStore((s) => s.selectedApprovalId);
  const select = useRoadmapStore((s) => s.select);
  const [reporting, setReporting] = useState(false);
  const [history, setHistory] = useState(false);

  const approval = roadmap.approvals.find((a) => a.id === selectedId);
  if (!approval) return null;

  const onCriticalPath = roadmap.critical_path.includes(approval.id);
  const prerequisites = roadmap.dependencies.filter((d) => d.to_approval_id === approval.id);
  const unlocks = roadmap.dependencies.filter((d) => d.from_approval_id === approval.id);
  const finish = roadmap.earliest_finish[approval.id];
  const start = finish - approval.statutory_days;
  const nameOf = (id: string) => roadmap.approvals.find((a) => a.id === id)?.name ?? id;

  return (
    <aside
      key={approval.id}
      className="anim-panel absolute bottom-0 right-0 top-0 z-10 flex w-[384px] flex-col overflow-y-auto border-l border-db-line bg-surface shadow-panel"
    >
      <div className="border-b border-db-line px-[18px] pb-3.5 pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[11px] font-semibold tracking-[0.06em] ${
                onCriticalPath ? "text-db-red" : "text-db-ink"
              }`}
            >
              {approval.id}
            </span>
            {onCriticalPath ? <Badge tone="critical">ON CRITICAL PATH</Badge> : null}
            {approval.flagged ? <Badge tone="deemed">UNDER REVIEW</Badge> : null}
          </div>
          <button onClick={() => select(null)} aria-label="Close panel" className="text-db-muted hover:text-db-ink">
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <h2 className="mb-1.5 text-[21px] font-bold leading-tight text-db-ink">
          {approval.name}
        </h2>
        <p className="text-[12.5px] text-db-muted">{approval.department_name}</p>
      </div>

      <div className="flex border-b border-db-line">
        <div className="flex-1 border-r border-db-line px-[18px] py-3">
          <Label className="mb-0.5 block">Statutory</Label>
          <div className="flex items-baseline gap-1">
            <span className="font-num font-sans text-2xl font-medium text-db-ink">
              {approval.statutory_days}
            </span>
            <span className="text-[11.5px] text-db-muted">days</span>
          </div>
        </div>
        <div className="flex-1 border-r border-db-line px-[18px] py-3">
          <Label className="mb-0.5 block">Earliest start</Label>
          <div className="flex items-baseline gap-1">
            <span className="font-num font-sans text-2xl font-medium text-db-ink">{start}</span>
            <span className="text-[11.5px] text-db-muted">day</span>
          </div>
        </div>
        <div className="flex-1 px-[18px] py-3">
          <Label className={`mb-0.5 block ${approval.deemed_exists ? "text-db-amber" : ""}`}>
            {approval.deemed_exists ? "Deemed at" : "Deemed"}
          </Label>
          {approval.deemed_exists ? (
            <div className="flex items-baseline gap-1">
              <span className="font-num font-sans text-2xl font-medium text-db-amber">
                {approval.deemed_days}
              </span>
              <span className="text-[11.5px] text-db-muted">days</span>
            </div>
          ) : (
            <div className="flex h-[29px] items-center font-mono text-[11.5px] text-db-muted">
              Not available
            </div>
          )}
        </div>
      </div>

      {approval.deemed_exists && approval.deemed_reference ? (
        <div className="border-b border-db-line px-[18px] py-2.5 text-[11.5px] leading-relaxed text-db-muted">
          {approval.deemed_reference}
        </div>
      ) : null}

      <div className="border-b border-db-line px-[18px] py-3.5">
        <Label className="mb-2 block">Prerequisites · {prerequisites.length}</Label>
        {prerequisites.length === 0 ? (
          <p className="text-[12px] text-db-muted">Nothing blocks this. It can be filed on day one.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {prerequisites.map((d) => (
              <div key={d.from_approval_id} className="rounded-xl border border-db-line bg-bg px-2.5 py-2.5">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <span className="text-[12.5px] font-medium text-db-ink">
                    {d.from_approval_id} · {nameOf(d.from_approval_id)}
                  </span>
                  <ConfidenceBadge type={d.edge_type} />
                </div>
                <p className="text-[11.5px] leading-relaxed text-db-muted">{d.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-db-line px-[18px] py-3.5">
        <Label className="mb-2 block">Unlocks · {unlocks.length}</Label>
        {unlocks.length === 0 ? (
          <p className="text-[12px] text-db-muted">Nothing waits on this one.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {unlocks.map((d) => (
              <div key={d.to_approval_id} className="flex items-center justify-between gap-2">
                <span className="truncate text-[12.5px] text-db-ink">
                  {d.to_approval_id} · {nameOf(d.to_approval_id)}
                </span>
                <ConfidenceBadge type={d.edge_type} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-db-line px-[18px] py-3.5">
        <Label className="mb-2 block">
          Documents required · {approval.required_documents.length}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {approval.required_documents.map((doc) => (
            <span
              key={doc}
              className="inline-flex h-[21px] items-center rounded-lg border border-db-line px-[7px] text-[11.5px] text-db-ink"
            >
              {doc}
            </span>
          ))}
        </div>
      </div>

      {evidence[approval.id] ? <EvidenceBlock evidence={evidence[approval.id]} /> : null}

      <ProvenanceBlock approval={approval} />

      <div className="flex items-center gap-2.5 px-[18px] py-3">
        <Button className="flex-1" onClick={() => setReporting(true)}>
          <TriangleAlert className="h-3 w-3" strokeWidth={1.4} />
          Report a rejection
        </Button>
        <Button className="flex-1" onClick={() => setHistory(true)}>
          Version history
        </Button>
      </div>

      <ReportRejectionDialog
        approval={approval}
        open={reporting}
        onClose={() => setReporting(false)}
      />

      {/* What this row is, where it came from, and who stands behind it. The
          rule store keeps all of it; the panel was just not showing it. */}
      <Dialog open={history} onClose={() => setHistory(false)} title="Version history">
        <dl className="grid grid-cols-[132px_1fr] gap-x-4 gap-y-2 text-[12.5px]">
          <dt className="text-db-muted">Approval</dt>
          <dd className="text-db-ink">
            <span className="font-mono text-[11.5px]">{approval.id}</span> {approval.name}
          </dd>
          <dt className="text-db-muted">Rule version</dt>
          <dd className="font-mono text-db-ink">{approval.version}</dd>
          <dt className="text-db-muted">Review status</dt>
          <dd className="text-db-ink">{approval.review_status.replace(/_/g, " ")}</dd>
          <dt className="text-db-muted">Confidence</dt>
          <dd className="font-num text-db-ink">{approval.confidence.toFixed(2)}</dd>
          <dt className="text-db-muted">Provision</dt>
          <dd className="text-db-ink">
            {approval.source.document_id.replace(/-/g, " ")} ·{" "}
            <span className="font-mono text-[11.5px]">{approval.source.section}</span>
          </dd>
          <dt className="text-db-muted">In force from</dt>
          <dd className="font-mono text-db-ink">{approval.source.effective_from}</dd>
          <dt className="text-db-muted">In force to</dt>
          <dd className="font-mono text-db-ink">{approval.source.effective_to ?? "—"}</dd>
          <dt className="text-db-muted">Checked by</dt>
          <dd className="text-db-ink">{approval.verified_by ?? "not yet checked"}</dd>
          <dt className="text-db-muted">Checked on</dt>
          <dd className="font-mono text-db-ink">{approval.verified_on ?? "—"}</dd>
          {approval.flagged ? (
            <>
              <dt className="text-db-muted">Open review</dt>
              <dd className="text-db-red">
                A review task is open against this rule. It stays in use until a human
                publishes a change.
              </dd>
            </>
          ) : null}
        </dl>
        <p className="mt-4 border-t border-db-line pt-3 text-[11.5px] leading-relaxed text-db-muted">
          One version of one rule. A roadmap generated earlier resolves against the rules
          that were in force then, which is why the version and the dates travel with the
          row rather than sitting in a changelog.
        </p>
      </Dialog>
    </aside>
  );
}

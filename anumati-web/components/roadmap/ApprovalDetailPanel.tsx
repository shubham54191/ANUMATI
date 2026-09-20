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
      className="anim-panel absolute bottom-0 right-0 top-0 z-10 flex w-[384px] flex-col overflow-y-auto border-l border-line bg-surface shadow-panel"
    >
      <div className="border-b border-line px-[18px] pb-3.5 pt-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[11px] font-semibold tracking-[0.06em] ${
                onCriticalPath ? "text-critical" : "text-ink"
              }`}
            >
              {approval.id}
            </span>
            {onCriticalPath ? <Badge tone="critical">ON CRITICAL PATH</Badge> : null}
            {approval.flagged ? <Badge tone="deemed">UNDER REVIEW</Badge> : null}
          </div>
          <button onClick={() => select(null)} aria-label="Close panel" className="text-muted hover:text-ink">
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <h2 className="mb-1.5 font-serif text-[21px] font-medium leading-tight text-ink">
          {approval.name}
        </h2>
        <p className="text-[12.5px] text-muted">{approval.department_name}</p>
      </div>

      <div className="flex border-b border-line">
        <div className="flex-1 border-r border-line px-[18px] py-3">
          <Label className="mb-0.5 block">Statutory</Label>
          <div className="flex items-baseline gap-1">
            <span className="font-num font-serif text-2xl font-medium text-ink">
              {approval.statutory_days}
            </span>
            <span className="text-[11.5px] text-muted">days</span>
          </div>
        </div>
        <div className="flex-1 border-r border-line px-[18px] py-3">
          <Label className="mb-0.5 block">Earliest start</Label>
          <div className="flex items-baseline gap-1">
            <span className="font-num font-serif text-2xl font-medium text-ink">{start}</span>
            <span className="text-[11.5px] text-muted">day</span>
          </div>
        </div>
        <div className="flex-1 px-[18px] py-3">
          <Label className={`mb-0.5 block ${approval.deemed_exists ? "text-state-deemed-ink" : ""}`}>
            {approval.deemed_exists ? "Deemed at" : "Deemed"}
          </Label>
          {approval.deemed_exists ? (
            <div className="flex items-baseline gap-1">
              <span className="font-num font-serif text-2xl font-medium text-state-deemed-ink">
                {approval.deemed_days}
              </span>
              <span className="text-[11.5px] text-muted">days</span>
            </div>
          ) : (
            <div className="flex h-[29px] items-center font-mono text-[11.5px] text-muted">
              Not available
            </div>
          )}
        </div>
      </div>

      {approval.deemed_exists && approval.deemed_reference ? (
        <div className="border-b border-line px-[18px] py-2.5 text-[11.5px] leading-relaxed text-muted">
          {approval.deemed_reference}
        </div>
      ) : null}

      <div className="border-b border-line px-[18px] py-3.5">
        <Label className="mb-2 block">Prerequisites · {prerequisites.length}</Label>
        {prerequisites.length === 0 ? (
          <p className="text-[12px] text-muted">Nothing blocks this. It can be filed on day one.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {prerequisites.map((d) => (
              <div key={d.from_approval_id} className="rounded border border-line bg-bg px-2.5 py-2.5">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <span className="text-[12.5px] font-medium text-ink">
                    {d.from_approval_id} · {nameOf(d.from_approval_id)}
                  </span>
                  <ConfidenceBadge type={d.edge_type} />
                </div>
                <p className="text-[11.5px] leading-relaxed text-muted">{d.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-line px-[18px] py-3.5">
        <Label className="mb-2 block">Unlocks · {unlocks.length}</Label>
        {unlocks.length === 0 ? (
          <p className="text-[12px] text-muted">Nothing waits on this one.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {unlocks.map((d) => (
              <div key={d.to_approval_id} className="flex items-center justify-between gap-2">
                <span className="truncate text-[12.5px] text-ink">
                  {d.to_approval_id} · {nameOf(d.to_approval_id)}
                </span>
                <ConfidenceBadge type={d.edge_type} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-line px-[18px] py-3.5">
        <Label className="mb-2 block">
          Documents required · {approval.required_documents.length}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {approval.required_documents.map((doc) => (
            <span
              key={doc}
              className="inline-flex h-[21px] items-center rounded-sm border border-line px-[7px] text-[11.5px] text-ink"
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
        <Button className="flex-1">Version history</Button>
      </div>

      <ReportRejectionDialog
        approval={approval}
        open={reporting}
        onClose={() => setReporting(false)}
      />
    </aside>
  );
}

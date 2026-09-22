import { FileText, ExternalLink } from "lucide-react";
import type { Approval } from "@/types/approval";
import { Label } from "@/components/ui/Card";

export function ProvenanceBlock({ approval }: { approval: Approval }) {
  return (
    <div className="flex-1 border-b border-line bg-sunk px-[18px] py-3.5">
      <div className="mb-2.5 flex items-center gap-1.5">
        <FileText className="h-3 w-3 text-ink" strokeWidth={1.3} />
        <Label className="text-ink">Source</Label>
      </div>

      <div className="mb-2.5 text-[12.5px] leading-relaxed text-ink">
        {approval.source.document_id.replace(/-/g, " ")} —{" "}
        <span className="font-mono text-xs">{approval.source.section}</span>
      </div>

      <div className="mb-2.5 flex gap-6">
        <div>
          <Label className="mb-0.5 block text-[9px]">Effective from</Label>
          <div className="font-num font-mono text-[11.5px] text-ink">
            {approval.source.effective_from}
          </div>
        </div>
        <div>
          <Label className="mb-0.5 block text-[9px]">Rule version</Label>
          <div className="font-mono text-[11.5px] text-ink">{approval.version}</div>
        </div>
        <div>
          <Label className="mb-0.5 block text-[9px]">Confidence</Label>
          <div className="font-num font-mono text-[11.5px] font-medium text-state-done-ink">
            {approval.confidence.toFixed(2)} {approval.verified_by ? "read" : "extracted"}
          </div>
        </div>
      </div>

      <a
        href={approval.source.url}
        target="_blank"
        rel="noreferrer"
        className="mb-2.5 flex items-center gap-1.5 text-xs no-underline hover:underline"
      >
        {approval.source.url.replace(new RegExp("^https?://"), "")}
        <ExternalLink className="h-2.5 w-2.5" strokeWidth={1.4} />
      </a>

      {approval.verified_by ? (
        <div className="text-[11.5px] text-muted">
          Read from the bare act by <span className="text-ink">{approval.verified_by}</span> on{" "}
          <span className="font-mono text-[11px]">{approval.verified_on}</span>. Departmental
          officer review still pending.
        </div>
      ) : (
        <div className="text-[11.5px] text-muted">
          Extracted, not yet verified by a reviewer.
        </div>
      )}
    </div>
  );
}

import { Lock } from "lucide-react";
import type { LeverImpact } from "@/types/simulation";
import { Label } from "@/components/ui/Card";

export function GuardrailCard({ refused }: { refused: LeverImpact | undefined }) {
  if (!refused) return null;
  return (
    <div className="flex-1 bg-sunk px-[22px] py-4">
      <div className="mb-2 flex items-center gap-1.5">
        <Lock className="h-3 w-3 text-ink" strokeWidth={1.5} />
        <Label className="text-ink">Statutory guardrail</Label>
      </div>
      <p className="mb-2 text-[12.5px] leading-relaxed text-ink">
        One lever is refused by the engine, not by a policy note:
      </p>
      <pre className="rounded border border-line bg-surface px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted">
        IllegalLeverError{"\n"}
        {refused.reason}
        {"\n"}
        <span className="text-faint">
          {refused.lever.from_id} → {refused.lever.to_id} · edge_type=statutory
        </span>
      </pre>
      <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
        Only timelines and practice-based conventions can be reformed here. Statute is out of reach
        by construction.
      </p>
    </div>
  );
}

"use client";
import { useState } from "react";
import { FlaskConical, ShieldCheck } from "lucide-react";
import type { RiskBand } from "@/types/compliance";
import { assessRisk, type RiskInput } from "@/lib/compliance/risk";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const BAND_META: Record<RiskBand, { label: string; text: string; bar: string; border: string }> = {
  low: { label: "LOW", text: "text-db-green", bar: "bg-db-green", border: "border-db-green/45" },
  medium: { label: "MEDIUM", text: "text-db-amber", bar: "bg-db-amber", border: "border-db-amber/45" },
  high: { label: "HIGH", text: "text-db-red", bar: "bg-db-red", border: "border-db-red/45" },
};

const POLLUTION: RiskInput["pollution"][] = ["white", "green", "orange", "red"];

/**
 * How hard this file gets looked at — and why.
 *
 * The score decides scrutiny, never the clearance itself. That distinction is
 * the whole reason a score is safe to show an applicant: nothing here can
 * grant or refuse anything, so seeing the arithmetic costs the state nothing
 * and tells the applicant exactly which fact is driving a site visit.
 */
export function RiskCard() {
  const conditions = useRoadmapStore((s) => s.conditions);
  const employees = useRoadmapStore((s) => s.employees);
  const heightM = useRoadmapStore((s) => s.heightM);
  const [pollution, setPollution] = useState<RiskInput["pollution"]>("orange");
  const [past, setPast] = useState(0);

  const assessment = assessRisk({
    hazardous: Boolean(conditions.hazardous),
    boiler: Boolean(conditions.boiler),
    heightM,
    employees,
    pollution,
    past_rejections: past,
  });
  const meta = BAND_META[assessment.band];

  return (
    <section className={cn("rounded-xl border bg-surface", meta.border)}>
      <div className="flex items-center gap-2 border-b border-db-line px-4 py-2.5">
        <ShieldCheck className={cn("h-3.5 w-3.5", meta.text)} strokeWidth={1.7} />
        <Label>Risk-based scrutiny</Label>
        <span
          className="flex items-center gap-1 rounded-lg border border-db-blue-secondary/50 bg-db-blue-secondary/[0.08] px-1.5 py-px font-mono text-[9px] font-medium tracking-[0.06em] text-db-amber"
          title="The Act allows risk-led inspection (s. 16) but sets no formula. These weights are the district's."
        >
          <FlaskConical className="h-2.5 w-2.5" strokeWidth={1.8} />
          PILOT PARAMETERS
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-6 px-4 pt-3.5">
        <div>
          <span className={cn("font-num text-[40px] font-bold leading-none", meta.text)}>
            {assessment.score.toFixed(1)}
          </span>
          <span className="ml-1.5 text-[12px] text-db-muted">/ 100</span>
        </div>
        <div className="pb-1.5">
          <div className={cn("font-mono text-[12px] font-semibold tracking-[0.06em]", meta.text)}>
            {meta.label} RISK
          </div>
          <p className="mt-0.5 max-w-lg text-[12.5px] leading-snug text-db-ink">{assessment.scrutiny}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 px-4 pb-3 pt-3">
        <label className="flex items-center gap-2">
          <Label>Pollution category</Label>
          <div className="flex items-center gap-1 rounded-xl border border-db-line bg-db-bg p-0.5">
            {POLLUTION.map((p) => (
              <button
                key={p}
                onClick={() => setPollution(p)}
                aria-pressed={pollution === p}
                className={cn(
                  "h-6 rounded-lg px-2 font-mono text-[10.5px] uppercase transition-colors",
                  pollution === p
                    ? "border border-db-blue/30 bg-db-blue-tint font-medium text-db-blue"
                    : "text-db-muted hover:text-db-blue",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </label>

        <label className="flex items-center gap-2">
          <Label>Prior objections</Label>
          <input
            type="number"
            min={0}
            max={9}
            value={past}
            onChange={(e) => setPast(Math.max(0, Math.min(9, Number(e.target.value) || 0)))}
            className="h-7 w-[64px] rounded-xl border border-db-line bg-surface px-2 font-mono text-[12px] text-db-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
      </div>

      <div className="border-t border-db-line px-4 py-3">
        <Label className="mb-2 block">What is driving the score</Label>
        <div className="flex flex-col gap-1.5">
          {assessment.factors.map((f) => (
            <div key={f.id} className="flex items-center gap-3" title={f.note}>
              <span className="w-[190px] flex-none truncate text-[12px] text-db-ink">{f.label}</span>
              <div className="h-[5px] flex-1 overflow-hidden rounded-lg bg-db-bg">
                <div
                  className={cn("h-full rounded-sm", f.points >= 70 ? "bg-db-red" : f.points >= 35 ? "bg-db-amber" : "bg-db-green")}
                  style={{ width: `${f.points}%` }}
                />
              </div>
              <span className="font-num w-[52px] flex-none text-right font-mono text-[11px] text-db-muted">
                {f.points}
              </span>
              <span className="font-num w-[52px] flex-none text-right font-mono text-[10.5px] text-db-faint">
                {(f.weight * 100).toFixed(0)}% wt
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-[11.5px] leading-relaxed text-db-muted">
          The score sets how hard the file is looked at. It cannot grant a clearance and it cannot
          refuse one — that stays with the authority the sectoral Act names, whatever this number says.
        </p>
      </div>
    </section>
  );
}

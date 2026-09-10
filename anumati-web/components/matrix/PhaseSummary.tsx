"use client";
import { BellRing, CheckCircle2, FileWarning, Gavel, Undo2 } from "lucide-react";
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";
import { useMatrixStore } from "@/store/useMatrixStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { WeightedScoreCard } from "./WeightedScoreCard";
import { cn } from "@/lib/utils";

const RESOLUTION_TITLE = {
  cleared: "Phase cleared",
  sent_for_revision: "Sent back to the applicant for revision",
  escalated: "With the tie-breaker panel",
  overruled: "Rejection overruled — phase cleared",
  sustained: "Rejection sustained — file returns to the applicant",
  failed_score: "Phase failed on the consolidated score",
} as const;

/** What the file looks like when it is not in conflict — or once it is settled. */
export function PhaseSummary({
  app,
  derived,
}: {
  app: ApplicationFile;
  derived: DerivedMatrixState;
}) {
  const finalise = useMatrixStore((s) => s.finalise);
  const setPacketOpen = useMatrixStore((s) => s.setPacketOpen);
  const setTieBreakerOpen = useMatrixStore((s) => s.setTieBreakerOpen);

  const resolution = app.resolution;

  return (
    <section className="border-b border-line bg-surface px-5 py-4">
      {resolution ? (
        <div
          className={cn(
            "anim-rise mb-4 rounded border px-4 py-3",
            resolution.kind === "cleared" || resolution.kind === "overruled"
              ? "border-state-done/45 bg-state-done/[0.06]"
              : "border-critical/45 bg-critical/[0.05]",
          )}
        >
          <div className="flex items-center gap-2">
            {resolution.kind === "cleared" || resolution.kind === "overruled" ? (
              <CheckCircle2 className="h-4 w-4 text-state-done-ink" strokeWidth={1.7} />
            ) : (
              <FileWarning className="h-4 w-4 text-critical" strokeWidth={1.7} />
            )}
            <h2 className="font-serif text-[17px] font-medium text-ink">
              {RESOLUTION_TITLE[resolution.kind]}
            </h2>
            <span className="font-mono text-[10.5px] text-muted">day {resolution.day}</span>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink">{resolution.note}</p>

          {resolution.kind === "failed_score" ? (
            <div className="mt-2.5 flex items-start gap-2 rounded-sm border border-critical/40 bg-surface px-2.5 py-2">
              <BellRing className="mt-0.5 h-3.5 w-3.5 flex-none text-critical" strokeWidth={1.7} />
              <div className="text-[12px] leading-snug text-ink">
                <span className="font-medium">Project manager notified automatically</span> — consolidated
                score {resolution.score.toFixed(1)} against a passing score of{" "}
                {app.rule.passing_score ?? 75}, on day {resolution.day}. Nobody had to declare the failure;
                the threshold did.
              </div>
            </div>
          ) : null}

          <div className="mt-2.5 flex flex-wrap gap-2">
            {resolution.kind === "sent_for_revision" ? (
              <Button onClick={() => setPacketOpen(true)}>
                <Undo2 className="h-3 w-3" strokeWidth={1.5} />
                View the revision packet
              </Button>
            ) : null}
            {resolution.kind === "overruled" || resolution.kind === "sustained" ? (
              <span className="font-mono text-[11px] text-muted">Decided by {resolution.by}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          <Label className="mb-2 block">Where the file stands</Label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              ["Approved", derived.approved.length, "text-state-done-ink"],
              ["Deemed approved", derived.deemed.length, "text-state-deemed-ink"],
              ["Rejected", derived.rejected.length, "text-critical"],
              ["Still open", derived.pending.length, "text-state-active"],
            ].map(([label, value, tone]) => (
              <div key={label as string} className="rounded border border-line bg-bg px-3 py-2.5">
                <Label className="mb-0.5 block">{label as string}</Label>
                <span className={cn("font-num font-serif text-[24px] font-medium", tone as string)}>
                  {value as number}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-3 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            {app.dispatched ? (
              <>
                All {app.reviews.length} departments received this file on day 0 and are running their own
                clocks against it. A department that misses its window is either escalated a tier or, where
                the clearance is not statutory, deemed to have approved — so one silent desk cannot hold the
                project.
              </>
            ) : (
              <>
                Nothing has been sent yet. Dispatch pushes the file to every stakeholder department at the
                same moment rather than passing it down a chain, which is what makes the parallel phase — and
                the conflict protocol behind it — necessary in the first place.
              </>
            )}
          </p>

          {derived.escalated.length > 0 ? (
            <div className="mt-3 rounded border border-state-deemed/45 bg-state-deemed/[0.06] px-3.5 py-2.5">
              <Label className="mb-1 block text-state-deemed-ink">Auto-escalated</Label>
              {derived.escalated.map((r) => (
                <p key={r.dept_id} className="text-[12px] leading-snug text-ink">
                  {r.dept_short} missed its {r.sla_days}-day window on day {r.escalated_on_day} — now with{" "}
                  {r.escalation_tier}.
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {derived.weighted ? <WeightedScoreCard weighted={derived.weighted} /> : null}

          {app.tie_breaker_open ? (
            <Button variant="deemed" onClick={() => setTieBreakerOpen(true)}>
              <Gavel className="h-3 w-3" strokeWidth={1.5} />
              Open the tie-breaker panel
            </Button>
          ) : null}

          <Button
            variant="primary"
            size="md"
            disabled={!derived.canFinalise}
            onClick={finalise}
            title={
              derived.canFinalise
                ? "Sign off the parallel review phase"
                : "Every department must clear, with no conflict open, before the phase can be finalised"
            }
          >
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.6} />
            Finalise approval
          </Button>
          {!derived.canFinalise && !resolution ? (
            <p className="text-[11.5px] leading-relaxed text-muted">
              Disabled until every lane clears. The master action never enables itself around an open
              rejection — that is the point of the gate.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

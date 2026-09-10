"use client";
import {
  BookMarked,
  CheckCircle2,
  Gavel,
  MessageSquare,
  Scale,
  ShieldAlert,
  SlidersHorizontal,
  Undo2,
  XCircle,
} from "lucide-react";
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";
import { clockOf, dateOf } from "@/lib/matrix/engine";
import { RULE_OUTCOME_LABEL } from "@/lib/matrix/rules";
import { useMatrixStore } from "@/store/useMatrixStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { WeightedScoreCard } from "./WeightedScoreCard";
import { cn } from "@/lib/utils";

/**
 * The Conflict Resolution Screen.
 *
 * Left: why the file was rejected, in the rejecting officer's own words.
 * Right: what the pre-defined decision matrix says happens next, with the
 * clause it comes from. The officer is not being asked to invent a policy at
 * 4pm on a Friday — they are being shown the one that already exists.
 */
export function ConflictResolutionScreen({
  app,
  derived,
}: {
  app: ApplicationFile;
  derived: DerivedMatrixState;
}) {
  const setTab = useMatrixStore((s) => s.setTab);
  const sendForRevision = useMatrixStore((s) => s.sendForRevision);
  const escalate = useMatrixStore((s) => s.escalate);
  const setTieBreakerOpen = useMatrixStore((s) => s.setTieBreakerOpen);

  const rejecter = derived.rejected[0];
  const approvers = [...derived.approved, ...derived.deemed];
  const evidence = app.records.find((r) => r.state === "mismatch");

  const RuleIcon =
    app.rule.kind === "veto" ? ShieldAlert : app.rule.kind === "escalation" ? Scale : SlidersHorizontal;

  return (
    <section className="anim-rise border-b border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line bg-sunk px-5 py-2.5">
        <ShieldAlert className="h-3.5 w-3.5 text-critical" strokeWidth={1.7} />
        <h2 className="font-serif text-[17px] font-medium text-ink">Conflict resolution</h2>
        <span className="text-[12px] text-muted">
          Two departments in the same parallel phase returned opposite decisions.
        </span>
        <div className="flex-1" />
        <Button onClick={() => setTab("thread")}>
          <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
          Open clarification thread
        </Button>
      </div>

      <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Left — the conflict cause. */}
        <div className="px-5 py-4">
          <Label className="mb-2.5 block">The conflict cause</Label>

          {rejecter ? (
            <>
              <div className="rounded border border-critical/45 bg-critical/[0.05] px-3.5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-critical" strokeWidth={1.7} />
                    <span className="font-mono text-[11.5px] font-semibold tracking-[0.05em] text-critical">
                      {rejecter.dept_short} REJECTED
                    </span>
                  </span>
                  {rejecter.decided_at ? (
                    <span className="font-mono text-[10.5px] text-muted">
                      {dateOf(rejecter.decided_at)} · {clockOf(rejecter.decided_at)} · day{" "}
                      {rejecter.decided_on_day}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-[13px] leading-relaxed text-ink">{rejecter.remarks}</p>

                <dl className="mt-3 grid grid-cols-[92px_1fr] gap-x-3 gap-y-1 border-t border-critical/25 pt-2.5 text-[11.5px]">
                  <dt className="text-muted">Department</dt>
                  <dd className="text-ink">{rejecter.dept_name}</dd>
                  <dt className="text-muted">Officer</dt>
                  <dd className="text-ink">
                    {rejecter.officer_name} — {rejecter.officer_designation}
                  </dd>
                  <dt className="text-muted">Clearance</dt>
                  <dd className="text-ink">
                    <span className="font-mono text-[11px]">{rejecter.approval_id}</span>{" "}
                    {rejecter.approval_name}
                  </dd>
                  {rejecter.score !== null ? (
                    <>
                      <dt className="text-muted">Score</dt>
                      <dd className="font-mono text-ink">{rejecter.score}/100</dd>
                    </>
                  ) : null}
                </dl>
              </div>

              {evidence ? (
                <div className="mt-3 rounded border border-state-deemed/45 bg-state-deemed/[0.06] px-3.5 py-2.5">
                  <Label className="mb-1 block text-state-deemed-ink">
                    Evidence pulled from the shared data matrix
                  </Label>
                  <p className="text-[12px] leading-relaxed text-ink">
                    <span className="font-medium">{evidence.label}</span> — {evidence.value}
                  </p>
                  <p className="mt-1 font-mono text-[10.5px] text-muted">
                    {evidence.source_short} · {evidence.endpoint}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-[12.5px] text-muted">No rejection recorded on this file.</p>
          )}

          <div className="mt-3 rounded border border-state-done/45 bg-state-done/[0.05] px-3.5 py-2.5">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-state-done-ink" strokeWidth={1.7} />
              <span className="font-mono text-[11px] font-semibold tracking-[0.05em] text-state-done-ink">
                CLEARED IN THE SAME PHASE
              </span>
            </span>
            <div className="mt-2 flex flex-col gap-1.5">
              {approvers.map((a) => (
                <div key={a.dept_id} className="text-[12px] leading-snug text-ink">
                  <span className="font-mono text-[11px] text-muted">{a.dept_short}</span> — {a.remarks}
                </div>
              ))}
              {approvers.length === 0 ? (
                <span className="text-[12px] text-muted">None yet.</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right — what the matrix says. */}
        <div className="px-5 py-4">
          <Label className="mb-2.5 block">The system rules — pre-defined decision matrix</Label>

          <div className="rounded border border-accent/30 bg-accent-muted/40 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <RuleIcon className="h-3.5 w-3.5 text-accent" strokeWidth={1.7} />
                <span className="font-mono text-[11.5px] font-semibold tracking-[0.05em] text-accent">
                  {app.rule.id}
                </span>
              </span>
              <span className="font-mono text-[10.5px] text-muted">{app.rule.label}</span>
            </div>

            <p className="mt-2 text-[13px] leading-relaxed text-ink">{app.rule.summary}</p>

            <div className="mt-3 flex items-start gap-2 border-t border-accent/20 pt-2.5">
              <BookMarked className="mt-0.5 h-3 w-3 flex-none text-muted" strokeWidth={1.6} />
              <span className="text-[11.5px] leading-snug text-muted">
                {app.rule.authority} — <span className="font-mono">{app.rule.authority_section}</span>
              </span>
            </div>
          </div>

          <div className="mt-3 rounded border border-line bg-bg px-3.5 py-3">
            <Label className="mb-1.5 block">What that means for this file</Label>

            {app.rule.kind === "veto" ? (
              <>
                <p className="text-[12.5px] leading-relaxed text-ink">
                  {derived.vetoedBy ? (
                    <>
                      <span className="font-medium">{derived.vetoedBy.dept_short}</span> is a designated
                      technical authority on this file. Its rejection is a dealbreaker —{" "}
                      {approvers.map((a) => a.dept_short).join(", ") || "another department"}&apos;s approval
                      cannot override it, and the stage halts.
                    </>
                  ) : (
                    <>
                      The rejecting department does not hold a veto on this file, so the phase does not halt
                      automatically.
                    </>
                  )}
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-[12px] text-muted">
                  <li>· Master action <span className="font-medium text-ink">Finalise approval</span> is disabled.</li>
                  <li>· The phase progress bar is held at amber, not red — the file is recoverable.</li>
                  <li>· Clearances already granted are carried forward on resubmission.</li>
                </ul>
                <p className="mt-2 font-mono text-[10.5px] tracking-[0.04em] text-muted">
                  VETO DEPARTMENTS: {(app.rule.veto_departments ?? []).join(", ").toUpperCase()}
                </p>
              </>
            ) : null}

            {app.rule.kind === "escalation" ? (
              <>
                <p className="text-[12.5px] leading-relaxed text-ink">
                  Both departments carry equal weight on this file, so neither may override the other. The
                  matrix opens an escalation path to{" "}
                  <span className="font-medium">{app.rule.tie_breaker?.panel}</span>, chaired by{" "}
                  {app.rule.tie_breaker?.chair}, with a {app.rule.tie_breaker?.sla_days}-day window.
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-[12px] text-muted">
                  {(app.rule.tie_breaker?.members ?? []).map((m) => (
                    <li key={m}>· {m}</li>
                  ))}
                </ul>
              </>
            ) : null}

            {app.rule.kind === "weighted" && derived.weighted ? (
              <p className="text-[12.5px] leading-relaxed text-ink">
                Departments score rather than vote. The consolidated weighted average is{" "}
                <span className="font-mono font-medium">{derived.weighted.score.toFixed(1)}</span> against a
                passing score of <span className="font-mono font-medium">{derived.weighted.threshold}</span>.{" "}
                {derived.weighted.complete
                  ? derived.weighted.pass
                    ? "The phase passes and can be finalised."
                    : "The phase fails and the project manager is notified."
                  : "Remaining departments have yet to score."}
              </p>
            ) : null}

            <div className="mt-2.5 border-t border-line pt-2 font-mono text-[10.5px] tracking-[0.04em] text-accent">
              OUTCOME: {RULE_OUTCOME_LABEL[app.rule.kind].toUpperCase()}
            </div>
          </div>

          {app.rule.kind === "weighted" && derived.weighted ? (
            <div className="mt-3">
              <WeightedScoreCard weighted={derived.weighted} />
            </div>
          ) : null}
        </div>
      </div>

      {/* The resolution path the rule unlocks. */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line bg-sunk px-5 py-3">
        <Label className="flex-none">Resolution path</Label>

        {app.rule.kind === "veto" ? (
          <>
            <Button variant="primary" onClick={sendForRevision}>
              <Undo2 className="h-3 w-3" strokeWidth={1.5} />
              Send for revision
            </Button>
            <span className="text-[12px] text-muted">
              Packages {derived.rejected.map((r) => r.dept_short).join(", ")}&apos;s objections with the
              clearances already granted and returns the file to the applicant.
            </span>
          </>
        ) : null}

        {app.rule.kind === "escalation" ? (
          <>
            {app.tie_breaker_open ? (
              <>
                <Button variant="primary" onClick={() => setTieBreakerOpen(true)}>
                  <Gavel className="h-3 w-3" strokeWidth={1.5} />
                  Open tie-breaker panel
                </Button>
                <span className="text-[12px] text-muted">
                  Routed automatically the moment the deadlock was detected — a temporary node is on the
                  track and the file is on {app.rule.tie_breaker?.chair}&apos;s dashboard. Nobody had to
                  forward it.
                </span>
              </>
            ) : (
              <>
                <Button variant="primary" onClick={escalate}>
                  <Scale className="h-3 w-3" strokeWidth={1.5} />
                  Route to {app.rule.tie_breaker?.panel}
                </Button>
                <span className="text-[12px] text-muted">
                  Adds a temporary tie-breaker node to the parallel track and puts the file on the
                  panel&apos;s dashboard.
                </span>
              </>
            )}
          </>
        ) : null}

        {app.rule.kind === "weighted" && derived.weighted ? (
          <span className="flex items-center gap-2 text-[12px] text-muted">
            <XCircle
              className={cn(
                "h-3.5 w-3.5 flex-none",
                derived.weighted.pass ? "text-state-done-ink" : "text-critical",
              )}
              strokeWidth={1.6}
            />
            {derived.pending.length > 0 ? (
              <>
                <span className="font-medium text-ink">
                  {derived.pending.length} department{derived.pending.length === 1 ? "" : "s"} still to score.
                </span>{" "}
                The threshold decides on its own: once every desk has reported, a consolidated average under{" "}
                {derived.weighted.threshold} marks the phase failed and notifies the project manager. No
                officer signs a failure into existence.
              </>
            ) : (
              <>
                Every desk has reported at {derived.weighted.score.toFixed(1)} against a passing score of{" "}
                {derived.weighted.threshold}.
              </>
            )}
          </span>
        ) : null}

        <div className="flex-1" />
        <Button disabled title="Disabled while the phase is in conflict">
          <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
          Finalise approval
        </Button>
      </div>

      <p
        className={cn(
          "border-t border-line px-5 py-2 text-[11.5px] leading-relaxed text-muted",
          "bg-surface",
        )}
      >
        Nothing on this screen was decided by the console. The rejection is the rejecting officer&apos;s;
        the tie-break is the matrix row&apos;s. Every step lands in the audit trail with the clause it was
        taken under.
      </p>
    </section>
  );
}

"use client";
import {
  CheckCircle2,
  Clock,
  Gavel,
  Lightbulb,
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
import { AuthorityLine } from "./AuthorityLine";
import { WeightedScoreCard } from "./WeightedScoreCard";
import { cn } from "@/lib/utils";

/**
 * The Conflict Resolution Screen — three cards, read left to right.
 *
 * What went wrong, what the pre-defined matrix says about it, and what that
 * means for this file. The officer is not being asked to invent a policy at
 * 4pm on a Friday; they are being shown the one that already exists, with the
 * clause it comes from.
 */

function CardShell({
  tone,
  Icon,
  title,
  meta,
  children,
  delay,
}: {
  tone: "red" | "blue" | "green";
  Icon: typeof Clock;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  delay: number;
}) {
  const SHELL = {
    red: "border-db-red-line bg-db-red-tint",
    blue: "border-db-blue/20 bg-db-blue-tint/70",
    green: "border-db-green/20 bg-db-green-tint",
  }[tone];
  const TILE = {
    red: "bg-db-red text-white",
    blue: "bg-db-blue text-white",
    green: "bg-db-green text-white",
  }[tone];

  return (
    <div
      className={cn("db-rise flex min-w-0 flex-1 flex-col rounded-xl border px-4 py-3.5", SHELL)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <span className={cn("flex h-6 w-6 flex-none items-center justify-center rounded-lg", TILE)}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
        </span>
        <span className="flex-none whitespace-nowrap text-[10.5px] font-bold tracking-[0.08em] text-db-ink">{title}</span>
        <div className="flex-1" />
        {meta}
      </div>
      <div className="mt-3 min-w-0 flex-1">{children}</div>
    </div>
  );
}

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
    <section className="flex flex-col gap-4">
      {/* The strip that names the situation and opens the conversation. */}
      <div className="db-rise flex flex-wrap items-center gap-3 rounded-xl border border-db-red-line bg-db-red-tint px-4 py-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-db-red text-white">
          <ShieldAlert className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-[14px] font-semibold text-db-red">Conflict resolution</span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-db-muted">
          Two departments in the same parallel phase returned opposite decisions.
        </span>
        <button
          onClick={() => setTab("thread")}
          className="flex h-9 flex-none items-center gap-2 rounded-lg border border-db-line bg-surface px-3.5 text-[12.5px] font-medium text-db-ink transition-colors hover:border-db-blue/40 hover:text-db-blue"
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />
          Open clarification thread
        </button>
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        {/* 1 — why the file stopped. */}
        <CardShell
          tone="red"
          Icon={Clock}
          title="THE CONFLICT CAUSE"
          delay={60}
          meta={
            rejecter?.decided_at ? (
              <span className="flex-none truncate text-[10px] text-db-muted">
                {dateOf(rejecter.decided_at)} · {clockOf(rejecter.decided_at)} · day{" "}
                {rejecter.decided_on_day}
              </span>
            ) : null
          }
        >
          {rejecter ? (
            <>
              <div className="flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5 flex-none text-db-red" strokeWidth={2} />
                <span className="text-[11.5px] font-bold tracking-[0.04em] text-db-red">
                  {rejecter.dept_short} REJECTED
                </span>
              </div>

              <p className="mt-2 text-[12.5px] leading-relaxed text-db-ink">{rejecter.remarks}</p>

              <dl className="mt-3 grid grid-cols-[84px_1fr] gap-x-3 gap-y-1.5 border-t border-db-red/15 pt-2.5 text-[11.5px]">
                <dt className="text-db-muted">Department</dt>
                <dd className="text-db-ink">{rejecter.dept_name}</dd>
                <dt className="text-db-muted">Officer</dt>
                <dd className="text-db-ink">
                  {rejecter.officer_name} — {rejecter.officer_designation}
                </dd>
                <dt className="text-db-muted">Clearance</dt>
                <dd className="text-db-ink">
                  <span className="font-mono text-[11px]">{rejecter.approval_id}</span>{" "}
                  {rejecter.approval_name}
                </dd>
                {rejecter.score !== null ? (
                  <>
                    <dt className="text-db-muted">Score</dt>
                    <dd className="font-num text-db-ink">{rejecter.score}/100</dd>
                  </>
                ) : null}
              </dl>

              {evidence ? (
                <div className="mt-3 rounded-lg border border-db-amber-line bg-db-amber-tint px-3 py-2">
                  <span className="text-[9.5px] font-bold tracking-[0.07em] text-db-amber">
                    EVIDENCE FROM THE SHARED DATA MATRIX
                  </span>
                  <p className="mt-1 text-[11.5px] leading-snug text-db-ink">
                    <span className="font-semibold">{evidence.label}</span> — {evidence.value}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-[12.5px] text-db-muted">No rejection recorded on this file.</p>
          )}
        </CardShell>

        {/* 2 — the rule that already existed. */}
        <CardShell
          tone="blue"
          Icon={RuleIcon}
          title="THE SYSTEM RULES"
          delay={140}
          meta={
            <span className="flex-none truncate text-[9px] font-bold tracking-[0.05em] text-db-muted">
              PRE-DEFINED MATRIX
            </span>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-db-blue">
              <ShieldAlert className="h-3 w-3" strokeWidth={2.2} />
              {app.rule.id}
            </span>
            <span className="text-[11.5px] text-db-muted">{app.rule.label}</span>
          </div>

          <p className="mt-2.5 text-[12.5px] leading-relaxed text-db-ink">{app.rule.summary}</p>

          <AuthorityLine rule={app.rule} className="mt-3 border-t border-db-blue/15 pt-2.5" />

          <div className="mt-2 text-[10.5px] font-semibold tracking-[0.04em] text-db-blue">
            OUTCOME: {RULE_OUTCOME_LABEL[app.rule.kind].toUpperCase()}
          </div>
        </CardShell>

        {/* 3 — what it means here, and the one action it unlocks. */}
        <CardShell tone="green" Icon={Lightbulb} title="WHAT THAT MEANS" delay={220}>
          <div className="flex h-full flex-col">
            <div className="flex-1">
              {app.rule.kind === "veto" ? (
                <p className="text-[12.5px] leading-relaxed text-db-ink">
                  {derived.vetoedBy ? (
                    <>
                      <span className="font-semibold">{derived.vetoedBy.dept_short}</span> is a
                      designated technical authority on this file. Its rejection is a dealbreaker —{" "}
                      {approvers.map((a) => a.dept_short).join(", ") || "another department"}&apos;s
                      approval cannot override it, and the stage returns for correction.
                    </>
                  ) : (
                    <>
                      The rejecting department does not hold a veto on this file, so the phase does not
                      halt automatically.
                    </>
                  )}
                </p>
              ) : null}

              {app.rule.kind === "escalation" ? (
                <p className="text-[12.5px] leading-relaxed text-db-ink">
                  Both departments carry equal weight, so neither may override the other. The matrix
                  opens an escalation path to{" "}
                  <span className="font-semibold">{app.rule.tie_breaker?.panel}</span>, chaired by{" "}
                  {app.rule.tie_breaker?.chair}, with a {app.rule.tie_breaker?.sla_days}-day window.
                </p>
              ) : null}

              {app.rule.kind === "weighted" && derived.weighted ? (
                <p className="text-[12.5px] leading-relaxed text-db-ink">
                  Departments score rather than vote. The consolidated weighted average is{" "}
                  <span className="font-num font-semibold">{derived.weighted.score.toFixed(1)}</span>{" "}
                  against a passing score of{" "}
                  <span className="font-num font-semibold">{derived.weighted.threshold}</span>.{" "}
                  {derived.weighted.complete
                    ? derived.weighted.pass
                      ? "The phase passes and can be finalised."
                      : "The phase fails and the project manager is notified."
                    : "Remaining departments have yet to score."}
                </p>
              ) : null}

              {approvers.length > 0 ? (
                <div className="mt-3 rounded-lg border border-db-green/20 bg-surface px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.06em] text-db-green">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2.2} />
                    CLEARED IN THE SAME PHASE
                  </span>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {approvers.map((a) => (
                      <div key={a.dept_id} className="text-[11.5px] leading-snug text-db-muted">
                        <span className="font-semibold text-db-ink">{a.dept_short}</span> — {a.remarks}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-3.5">
              {app.rule.kind === "veto" ? (
                <button
                  onClick={sendForRevision}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-db-green px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:brightness-95"
                >
                  <Undo2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Send for revision
                </button>
              ) : null}

              {app.rule.kind === "escalation" ? (
                <button
                  onClick={app.tie_breaker_open ? () => setTieBreakerOpen(true) : escalate}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-db-green px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:brightness-95"
                >
                  <Gavel className="h-3.5 w-3.5" strokeWidth={2} />
                  {app.tie_breaker_open
                    ? "Open tie-breaker panel"
                    : `Route to ${app.rule.tie_breaker?.panel ?? "the panel"}`}
                </button>
              ) : null}

              {app.rule.kind === "weighted" ? (
                <p className="text-[11.5px] leading-snug text-db-muted">
                  {derived.pending.length > 0
                    ? `${derived.pending.length} desk${derived.pending.length === 1 ? "" : "s"} still to score. The threshold decides on its own — no officer signs a failure into existence.`
                    : "Every desk has reported. The threshold has decided."}
                </p>
              ) : null}
            </div>
          </div>
        </CardShell>
      </div>

      {app.rule.kind === "weighted" && derived.weighted ? (
        <div className="db-rise">
          <WeightedScoreCard weighted={derived.weighted} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-db-line bg-surface px-4 py-3">
        <p className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-db-muted">
          Nothing on this screen was decided by the console. The rejection is the rejecting
          officer&apos;s; the tie-break is the matrix row&apos;s. Every step lands in the audit trail
          with the clause it was taken under.
        </p>
        <button
          disabled
          title="Disabled while the phase is in conflict"
          className="flex h-9 flex-none items-center gap-2 rounded-lg border border-db-line px-3.5 text-[12.5px] text-db-faint opacity-60"
        >
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
          Finalise approval
        </button>
      </div>
    </section>
  );
}

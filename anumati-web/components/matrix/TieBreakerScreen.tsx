"use client";
import { useState } from "react";
import { Gavel, ShieldCheck, ThumbsDown, X } from "lucide-react";
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";
import { clockOf } from "@/lib/matrix/engine";
import { useMatrixStore } from "@/store/useMatrixStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";

/**
 * Scenario B, the panel's own screen.
 *
 * A senior officer opening this sees both departments' inputs side by side and
 * exactly two buttons. There is no third option on purpose: an escalation that
 * can be left half-decided is how a file spends six months on a desk.
 */
export function TieBreakerScreen({
  app,
  derived,
}: {
  app: ApplicationFile;
  derived: DerivedMatrixState;
}) {
  const close = useMatrixStore((s) => s.setTieBreakerOpen);
  const tieBreak = useMatrixStore((s) => s.tieBreak);
  const session = useAuthStore((s) => s.session);
  const [note, setNote] = useState("");

  const panel = app.rule.tie_breaker;
  const chair = panel?.chair ?? "Steering committee";
  const rejecter = derived.rejected[0];
  const approver = derived.approved[0] ?? derived.deemed[0];

  const decide = (outcome: "overrule" | "sustain") => {
    tieBreak(
      outcome,
      chair,
      note.trim() ||
        (outcome === "overrule"
          ? "Objection noted but not sufficient to block the phase. Conditions to be enforced at the operating stage."
          : "Objection upheld. The applicant must correct the file before the phase can resume."),
    );
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink/30" onClick={() => close(false)} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tie-breaker panel review"
        className="anim-rise relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded border border-line bg-surface shadow-panel"
      >
        <header className="flex flex-none items-start gap-3 border-b border-line bg-sunk px-5 py-3.5">
          <Gavel className="mt-0.5 h-4 w-4 flex-none text-state-deemed-ink" strokeWidth={1.7} />
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[19px] font-medium leading-tight text-ink">
              {panel?.panel ?? "Steering committee review"}
            </h2>
            <p className="mt-0.5 text-[12px] text-muted">
              {app.id} · {app.project} — escalated under {app.rule.id}, {app.rule.authority}{" "}
              <span className="font-mono">{app.rule.authority_section}</span>
            </p>
          </div>
          <span className="flex-none rounded-sm border border-state-deemed/50 bg-state-deemed/[0.1] px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.05em] text-state-deemed-ink">
            {panel?.sla_days ?? 7} D WINDOW
          </span>
          <button onClick={() => close(false)} aria-label="Close" className="text-muted hover:text-ink">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="px-5 py-4">
              <Label className="mb-2 block text-state-done-ink">Department in favour</Label>
              {approver ? (
                <>
                  <div className="font-mono text-[12px] font-semibold tracking-[0.04em] text-ink">
                    {approver.dept_short} — {approver.dept_name}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted">
                    {approver.officer_name}, {approver.officer_designation}
                    {approver.decided_at ? ` · ${clockOf(approver.decided_at)} on day ${approver.decided_on_day}` : ""}
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink">{approver.remarks}</p>
                  <p className="mt-3 font-mono text-[10.5px] text-faint">
                    WEIGHT {approver.weight.toFixed(1)} · {approver.veto ? "HOLDS VETO" : "NO VETO"} ·{" "}
                    {approver.statutory ? "STATUTORY" : "NON-STATUTORY"}
                  </p>
                </>
              ) : (
                <p className="text-[12.5px] text-muted">No approval on record.</p>
              )}
            </div>

            <div className="px-5 py-4">
              <Label className="mb-2 block text-critical">Department objecting</Label>
              {rejecter ? (
                <>
                  <div className="font-mono text-[12px] font-semibold tracking-[0.04em] text-ink">
                    {rejecter.dept_short} — {rejecter.dept_name}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted">
                    {rejecter.officer_name}, {rejecter.officer_designation}
                    {rejecter.decided_at ? ` · ${clockOf(rejecter.decided_at)} on day ${rejecter.decided_on_day}` : ""}
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink">{rejecter.remarks}</p>
                  <p className="mt-3 font-mono text-[10.5px] text-faint">
                    WEIGHT {rejecter.weight.toFixed(1)} · {rejecter.veto ? "HOLDS VETO" : "NO VETO"} ·{" "}
                    {rejecter.statutory ? "STATUTORY" : "NON-STATUTORY"}
                  </p>
                </>
              ) : (
                <p className="text-[12.5px] text-muted">No rejection on record.</p>
              )}
            </div>
          </div>

          <div className="border-t border-line px-5 py-4">
            <Label className="mb-1.5 block">Panel</Label>
            <div className="flex flex-wrap gap-2">
              {(panel?.members ?? []).map((m) => (
                <span
                  key={m}
                  className="rounded-sm border border-line bg-bg px-2 py-1 text-[11.5px] text-ink"
                >
                  {m}
                </span>
              ))}
            </div>

            <label className="mt-4 block">
              <Label className="mb-1.5 block">Reason for the panel&apos;s decision</Label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Recorded against the file and shown to both departments."
                className="w-full rounded border border-control bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
          </div>
        </div>

        <footer className="flex flex-none flex-wrap items-center gap-3 border-t border-line bg-sunk px-5 py-3">
          <span className="text-[11.5px] text-muted">
            Signing as {session?.name} for {chair}
          </span>
          <div className="flex-1" />
          <Button variant="primary" onClick={() => decide("overrule")}>
            <ShieldCheck className="h-3 w-3" strokeWidth={1.6} />
            Overrule {rejecter?.dept_short ?? "objection"} &amp; approve
          </Button>
          <Button onClick={() => decide("sustain")}>
            <ThumbsDown className="h-3 w-3 text-critical" strokeWidth={1.6} />
            Sustain rejection
          </Button>
        </footer>
      </div>
    </div>
  );
}

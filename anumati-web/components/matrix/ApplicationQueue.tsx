"use client";
import { AlertTriangle, Clock, FileText, Info, Scale, ShieldAlert, SlidersHorizontal } from "lucide-react";
import type { ApplicationFile, MatrixRuleKind } from "@/types/matrix";
import { derive } from "@/lib/matrix/engine";
import { useMatrixStore } from "@/store/useMatrixStore";
import { cn } from "@/lib/utils";

const RULE_ICON: Record<MatrixRuleKind, typeof Scale> = {
  veto: ShieldAlert,
  escalation: Scale,
  weighted: SlidersHorizontal,
};

const RULE_SHORT: Record<MatrixRuleKind, string> = {
  veto: "VETO",
  escalation: "TIE-BREAK",
  weighted: "WEIGHTED",
};

function StatusLine({ app }: { app: ApplicationFile }) {
  const d = derive(app);

  if (app.resolution) {
    const map = {
      cleared: ["Phase cleared", "text-db-green"],
      sent_for_revision: ["Sent for revision", "text-db-red"],
      escalated: ["With the tie-breaker panel", "text-db-amber"],
      overruled: ["Rejection overruled — cleared", "text-db-green"],
      sustained: ["Rejection sustained", "text-db-red"],
      failed_score: ["Phase failed on score", "text-db-red"],
    } as const;
    const [label, tone] = map[app.resolution.kind];
    return <span className={cn("text-[11.5px] font-semibold", tone)}>{label}</span>;
  }
  if (!app.dispatched) {
    return <span className="text-[11.5px] text-db-muted">Awaiting dispatch</span>;
  }
  if (app.tie_breaker_open) {
    return (
      <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-db-amber">
        <Scale className="h-3.5 w-3.5" strokeWidth={1.8} />
        With tie-breaker
      </span>
    );
  }
  if (d.conflict) {
    return (
      <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-db-red">
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.8} />
        Conflict detected
      </span>
    );
  }
  if (d.breachedSla.length > 0) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-db-amber-tint px-2 py-1 text-[11px] font-semibold text-db-amber">
        <Clock className="h-3 w-3" strokeWidth={1.8} />
        {d.breachedSla.length} past SLA
      </span>
    );
  }
  return (
    <span className="rounded-full bg-db-blue-tint px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-db-blue">
      {d.pending.length} DESK{d.pending.length === 1 ? "" : "S"} REVIEWING
    </span>
  );
}

export function ApplicationQueue() {
  const applications = useMatrixStore((s) => s.applications);
  const selectedId = useMatrixStore((s) => s.selectedId);
  const select = useMatrixStore((s) => s.select);

  return (
    <aside className="flex w-[292px] flex-none flex-col border-r border-db-line bg-surface">
      <div className="flex h-[54px] flex-none items-center justify-between px-4">
        <span className="text-[11px] font-semibold tracking-[0.09em] text-db-faint">MY QUEUE</span>
        <span className="text-[12px] text-db-muted">{applications.length} files</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex flex-col gap-2.5">
          {applications.map((app, i) => {
            const d = derive(app);
            const Icon = RULE_ICON[app.rule.kind];
            const active = app.id === selectedId;
            const conflicted = d.conflict && !app.resolution;

            return (
              <button
                key={app.id}
                onClick={() => select(app.id)}
                aria-current={active}
                style={{ animationDelay: `${i * 70}ms` }}
                className={cn(
                  "db-rise db-lift block w-full rounded-xl border px-3.5 py-3 text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-db-blue",
                  active && conflicted && "border-db-red/50 bg-db-red-tint ring-1 ring-db-red/25",
                  active && !conflicted && "border-db-blue/40 bg-db-blue-tint/60 ring-1 ring-db-blue/20",
                  !active && "border-db-line bg-surface hover:border-db-blue/30",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-[9.5px] font-bold",
                        conflicted ? "bg-db-red text-white" : "bg-db-blue-tint text-db-blue",
                      )}
                    >
                      {conflicted ? "!" : <FileText className="h-3 w-3" strokeWidth={2} />}
                    </span>
                    <span className="truncate font-mono text-[11.5px] font-semibold tracking-[0.02em] text-db-ink">
                      {app.id}
                    </span>
                  </span>
                  <span
                    title={app.rule.label}
                    className={cn(
                      "flex flex-none items-center gap-1 rounded-full px-2 py-[3px] text-[9.5px] font-bold tracking-[0.05em]",
                      conflicted ? "bg-db-red/12 text-db-red" : "bg-db-blue-tint text-db-blue",
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" strokeWidth={2} />
                    {conflicted ? "CONFLICT" : RULE_SHORT[app.rule.kind]}
                  </span>
                </div>

                <div className="mt-2 line-clamp-2 text-[13px] font-semibold leading-snug text-db-ink">
                  {app.project}
                </div>
                <div className="mt-0.5 truncate text-[11.5px] text-db-muted">{app.applicant}</div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <StatusLine app={app} />
                  <span className="font-num flex-none text-[11px] text-db-faint">day {app.day}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-none px-3 pb-3">
        <div className="rounded-xl border border-db-blue/20 bg-db-blue-tint/60 px-3.5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-surface">
              <Info className="h-3.5 w-3.5 text-db-blue" strokeWidth={1.9} />
            </span>
            <span className="text-[10.5px] font-semibold tracking-[0.07em] text-db-ink">
              DECISION MATRIX IN FORCE
            </span>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-db-muted">
            Each file carries the governance rule that settles a disagreement between departments.
            The rule is data, not code — a state that tie-breaks differently edits the row, not the
            console.
          </p>
        </div>
      </div>
    </aside>
  );
}

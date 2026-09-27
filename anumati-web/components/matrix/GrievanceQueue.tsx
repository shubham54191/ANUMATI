"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import type { Grievance } from "@/types/compliance";
import type { ApplicationFile } from "@/types/matrix";
import { useGrievanceStore } from "@/store/useGrievanceStore";
import { useMatrixStore } from "@/store/useMatrixStore";
import { useAuthStore } from "@/store/useAuthStore";
import { api, ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const STATUS_META: Record<Grievance["status"], { label: string; text: string; border: string }> = {
  open: { label: "OPEN", text: "text-db-red", border: "border-db-red/45" },
  acknowledged: { label: "ACKNOWLEDGED", text: "text-db-amber", border: "border-db-amber/45" },
  resolved: { label: "RESOLVED", text: "text-db-green", border: "border-db-green/45" },
};

/**
 * What arrives when an applicant runs out of other options.
 *
 * The Committee may call for the department's reasons and inquire into the
 * delay (s. 8). It cannot grant the clearance itself on different terms — the
 * application is still disposed of under the relevant law.
 */
export function GrievanceQueue({ app }: { app?: ApplicationFile }) {
  const live = useMatrixStore((st) => st.mode) === "live";
  if (live && app) return <LiveGrievances app={app} />;
  return <BrowserGrievances />;
}

interface ServerGrievance {
  id: string;
  application_id: string;
  approval_id: string;
  dept_short: string;
  reason: string;
  days_pending: number;
  status: "open" | "acknowledged" | "resolved";
  raised_at: string;
  resolution: string | null;
}

/**
 * Live mode: the grievances the server holds for this file. Nothing to press
 * here — the Empowered Committee resolves them on its own desk, and a
 * department never sees a grievance against itself as a to-do.
 */
function LiveGrievances({ app }: { app: ApplicationFile }) {
  const role = useAuthStore((s) => s.session?.role);
  const [rows, setRows] = useState<ServerGrievance[] | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const events = app.events.length;

  useEffect(() => {
    let on = true;
    api<{ data: ServerGrievance[] }>("/v1/grievances")
      .then((r) => on && setRows(r.data.filter((g) => g.application_id === app.id)))
      .catch((e) => {
        if (!on) return;
        setRows([]);
        setBlocked(e instanceof ApiError && e.status === 403 ? "forbidden" : e instanceof ApiError ? e.message : "Could not load grievances.");
      });
    return () => {
      on = false;
    };
  }, [app.id, events]);

  const open = (rows ?? []).filter((g) => g.status !== "resolved").length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-2 border-b border-db-line px-4 py-2.5">
        <Scale className="h-3.5 w-3.5 text-db-blue" strokeWidth={1.6} />
        <Label>Grievances on this file</Label>
        <div className="flex-1" />
        <span className={cn("font-mono text-[10.5px]", open > 0 ? "font-medium text-db-red" : "text-db-faint")}>
          {open} open · {rows?.length ?? 0} total
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {blocked === "forbidden" ? (
          <p className="text-[12px] leading-relaxed text-db-muted">
            A grievance leaves the department it is about. It goes to the facilitation desk and the Empowered Committee
            (MAITRI Act, 2023 — s. 8(1)(g)); the Committee&apos;s outcome reaches this file through the thread and the ledger.
          </p>
        ) : blocked ? (
          <p className="text-[12px] text-db-red">{blocked}</p>
        ) : rows === null ? (
          <p className="text-[12px] text-db-muted">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-[12px] leading-relaxed text-db-muted">
            No grievance on this file. The applicant raises one from their application page on any desk that is still open.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {rows.map((g) => {
              const meta = STATUS_META[g.status];
              return (
                <div key={g.id} className={cn("rounded-xl border bg-surface px-3 py-2.5", meta.border)}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] font-semibold text-db-ink">{g.id}</span>
                    <span className="font-mono text-[10.5px] text-db-muted">
                      {g.approval_id} · {g.dept_short}
                    </span>
                    <div className="flex-1" />
                    <span className={cn("font-mono text-[9.5px] font-semibold tracking-[0.06em]", meta.text)}>{meta.label}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-snug text-db-ink">{g.reason}</p>
                  <p className="mt-1 text-[11px] text-db-muted">
                    Raised {new Date(g.raised_at).toLocaleDateString("en-IN")} · {g.days_pending} d pending at the time
                  </p>
                  {g.resolution ? <p className="mt-1 text-[11.5px] text-db-green">Committee: {g.resolution}</p> : null}
                </div>
              );
            })}
          </div>
        )}
        {role === "committee" || role === "admin" ? (
          <Link href="/committee" className="mt-3 inline-flex text-[12px] font-medium text-db-blue">
            Resolve on the Committee desk →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function BrowserGrievances() {
  const hydrate = useGrievanceStore((s) => s.hydrate);
  const filed = useGrievanceStore((s) => s.filed);
  const setStatus = useGrievanceStore((s) => s.setStatus);
  useEffect(() => hydrate(), [hydrate]);

  const all = useGrievanceStore.getState().all();
  const open = all.filter((g) => g.status === "open").length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-2 border-b border-db-line px-4 py-2.5">
        <Scale className="h-3.5 w-3.5 text-db-blue" strokeWidth={1.6} />
        <Label>Grievances</Label>
        <div className="flex-1" />
        <span
          className={cn(
            "font-mono text-[10.5px]",
            open > 0 ? "font-medium text-db-red" : "text-db-faint",
          )}
        >
          {open} open · {all.length} total
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {all.length === 0 ? (
          <p className="text-[12px] leading-relaxed text-db-muted">
            Nothing on the queue. An applicant raises one from the pre-check screen when a file has
            gone past its limit with no written query.
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5">
          {all.map((g) => {
            const meta = STATUS_META[g.status];
            const mine = filed.some((f) => f.id === g.id);
            return (
              <div key={g.id} className={cn("rounded-xl border bg-surface px-3 py-2.5", meta.border)}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px] font-semibold text-db-ink">
                    {g.id} · {g.approval_id} · {g.department_short}
                  </span>
                  <span className={cn("font-mono text-[9.5px] font-medium tracking-[0.06em]", meta.text)}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-0.5 text-[12px] font-medium text-db-ink">{g.approval_name}</div>
                <p className="mt-1 text-[11.5px] leading-snug text-db-ink">{g.reason}</p>
                <p className="mt-1 font-mono text-[10px] text-db-faint">
                  {g.applicant} · raised {g.raised_on} · {g.days_pending} d pending
                  {mine ? " · RAISED IN THIS SESSION" : ""}
                </p>
                <p className="mt-1 font-mono text-[10px] leading-snug text-db-muted">{g.authority}</p>

                {mine && g.status !== "resolved" ? (
                  <div className="mt-2 flex gap-2">
                    {g.status === "open" ? (
                      <Button onClick={() => setStatus(g.id, "acknowledged")} className="h-6 px-2 text-[11px]">
                        Acknowledge
                      </Button>
                    ) : null}
                    <Button onClick={() => setStatus(g.id, "resolved")} className="h-6 px-2 text-[11px]">
                      Mark resolved
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

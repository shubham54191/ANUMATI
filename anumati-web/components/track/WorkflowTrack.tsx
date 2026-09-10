"use client";
import { useMemo, useState } from "react";
import {
  CircleCheck,
  CirclePlay,
  Lock,
  LockKeyhole,
  MessageSquareWarning,
} from "lucide-react";
import type { Roadmap } from "@/types/roadmap";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import {
  buildActivityLog,
  buildTrackRows,
  groupByDepartment,
  type TrackRow,
  type TrackStatus,
} from "@/lib/data/trackState";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  TrackStatus,
  { label: string; Icon: typeof Lock; text: string; bg: string; track: string }
> = {
  locked: { label: "Locked", Icon: Lock, text: "text-muted", bg: "bg-state-pending", track: "bg-state-pending/20" },
  active: { label: "In progress", Icon: CirclePlay, text: "text-state-active", bg: "bg-state-active", track: "bg-state-active/20" },
  query: { label: "Query raised", Icon: MessageSquareWarning, text: "text-state-blocked", bg: "bg-state-blocked", track: "bg-state-blocked/20" },
  approved: { label: "Approved", Icon: CircleCheck, text: "text-state-done", bg: "bg-state-done", track: "bg-state-done/20" },
};

const EVENT_LABEL: Record<string, string> = {
  started: "window opened",
  approved: "approved",
  query_raised: "query raised",
  query_resolved: "query resolved",
};

export function WorkflowTrack({ roadmap }: { roadmap: Roadmap }) {
  const viewMode = useRoadmapStore((s) => s.viewMode);
  const activeDepartmentId = useRoadmapStore((s) => s.activeDepartmentId);
  const setActiveDepartmentId = useRoadmapStore((s) => s.setActiveDepartmentId);
  const select = useRoadmapStore((s) => s.select);
  const selectedId = useRoadmapStore((s) => s.selectedApprovalId);
  const isOfficer = viewMode === "department";

  const scaleDays = useMemo(
    () => Math.max(roadmap.optimised_days, ...Object.values(roadmap.earliest_finish), 1),
    [roadmap.optimised_days, roadmap.earliest_finish],
  );

  const [simulatedDay, setSimulatedDay] = useState(() => Math.round(scaleDays * 0.35));
  const day = Math.min(simulatedDay, scaleDays);

  const [interactions, setInteractions] = useState<Record<string, "queried" | "resolved">>({});
  const [queryLog, setQueryLog] = useState<
    { approvalId: string; day: number; kind: "query_raised" | "query_resolved" }[]
  >([]);

  const queried = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const k in interactions) if (interactions[k] === "queried") m[k] = true;
    return m;
  }, [interactions]);
  const resolved = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const k in interactions) if (interactions[k] === "resolved") m[k] = true;
    return m;
  }, [interactions]);

  const raiseQuery = (id: string) => {
    setInteractions((s) => ({ ...s, [id]: "queried" }));
    setQueryLog((log) => [...log, { approvalId: id, day, kind: "query_raised" }]);
  };
  const resolveQuery = (id: string) => {
    setInteractions((s) => ({ ...s, [id]: "resolved" }));
    setQueryLog((log) => [...log, { approvalId: id, day, kind: "query_resolved" }]);
  };

  const rows = useMemo(
    () => buildTrackRows(roadmap, day, queried, resolved),
    [roadmap, day, queried, resolved],
  );
  const groups = useMemo(() => groupByDepartment(rows), [rows]);
  const log = useMemo(() => buildActivityLog(rows, day, queryLog), [rows, day, queryLog]);

  const departments = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; short: string }>();
    for (const a of roadmap.approvals) {
      if (!seen.has(a.department_id)) {
        seen.set(a.department_id, { id: a.department_id, name: a.department_name, short: a.department_short });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [roadmap.approvals]);

  const overrunCount = rows.filter((r) => r.overrun).length;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg">
      <div className="flex h-[52px] flex-none items-center gap-4 border-b border-line bg-surface px-5">
        <span className="label flex-none">Simulated day</span>
        <input
          type="range"
          min={0}
          max={scaleDays}
          value={day}
          onChange={(e) => setSimulatedDay(Number(e.target.value))}
          aria-label="Simulated day"
          className="h-1.5 w-[220px] flex-none accent-[color:var(--accent)]"
        />
        <span className="font-num flex-none whitespace-nowrap font-mono text-[12px] text-ink">
          Day {day} <span className="text-faint">of {scaleDays}</span>
        </span>
        <span className="h-[18px] w-px flex-none bg-line" />

        {isOfficer ? (
          <label className="flex flex-none items-center gap-2 text-[12px] text-muted">
            You are
            <select
              value={activeDepartmentId ?? ""}
              onChange={(e) => setActiveDepartmentId(e.target.value || null)}
              className="h-8 rounded border border-control bg-bg px-2 text-[12.5px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink"
              aria-label="Which department are you signed in as"
            >
              <option value="">— pick a department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="text-[12px] text-faint">
            Applicant view — every department&apos;s status, read-only
          </span>
        )}

        <div className="flex-1" />
        {overrunCount > 0 ? (
          <span className="font-mono text-[11px] font-medium text-state-blocked">
            {overrunCount} SLA breach{overrunCount === 1 ? "" : "es"}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-4">
            {(Object.keys(STATUS_META) as TrackStatus[]).map((s) => {
              const meta = STATUS_META[s];
              return (
                <span key={s} className="flex items-center gap-1.5">
                  <meta.Icon className={cn("h-3.5 w-3.5", meta.text)} strokeWidth={1.6} />
                  <span className="text-[12px] text-ink">{meta.label}</span>
                </span>
              );
            })}
            <span className="flex items-center gap-1.5">
              <LockKeyhole className="h-3.5 w-3.5 text-faint" strokeWidth={1.6} />
              <span className="text-[12px] text-ink">Locked to another department</span>
            </span>
          </div>

          {groups.map((g) => (
            <section key={g.departmentId} className="mb-4">
              <header className="mb-1.5 flex items-center gap-2">
                <span className="text-[12.5px] font-medium text-ink">{g.departmentName}</span>
                <span className="font-mono text-[10.5px] text-faint">{g.departmentShort}</span>
              </header>
              <div className="flex flex-col gap-1.5">
                {g.rows.map((row) => {
                  const meta = STATUS_META[row.status];
                  const canAct =
                    isOfficer && activeDepartmentId === row.departmentId && (row.status === "active" || row.status === "query");
                  const leftPct = (row.start / scaleDays) * 100;
                  const widthPct = Math.max(((row.finish - row.start) / scaleDays) * 100, 2);
                  const fillPct = row.slaPct * 100;

                  return (
                    <div
                      key={row.approvalId}
                      className={cn(
                        "flex items-center gap-3 rounded border border-transparent px-1 py-1",
                        selectedId === row.approvalId && "border-line bg-sunk",
                      )}
                    >
                      <button
                        onClick={() => select(row.approvalId === selectedId ? null : row.approvalId)}
                        className="flex w-[220px] flex-none items-center gap-1.5 truncate text-left focus-visible:outline-none"
                        title={row.approvalName}
                      >
                        <meta.Icon className={cn("h-3 w-3 flex-none", meta.text)} strokeWidth={1.8} />
                        <span className="truncate text-[12px] text-ink">{row.approvalName}</span>
                        {row.onCriticalPath ? (
                          <span className="flex-none font-mono text-[9.5px] font-medium text-critical">CP</span>
                        ) : null}
                      </button>

                      <div className="relative h-6 flex-1 rounded-sm bg-sunk">
                        <div
                          className={cn("absolute top-0 h-6 rounded-sm", row.overrun ? "bg-state-blocked/25" : meta.track)}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        >
                          <div
                            className={cn("h-full rounded-sm", row.overrun ? "bg-state-blocked" : meta.bg)}
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>

                      <span className="font-num w-[64px] flex-none text-right font-mono text-[11px] text-muted">
                        d{row.start}–d{row.finish}
                      </span>

                      <div className="flex w-[132px] flex-none items-center justify-end gap-1.5">
                        {canAct ? (
                          row.status === "active" ? (
                            <Button variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => raiseQuery(row.approvalId)}>
                              Raise a query
                            </Button>
                          ) : (
                            <Button variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => resolveQuery(row.approvalId)}>
                              Resolve query
                            </Button>
                          )
                        ) : isOfficer && row.status !== "locked" && row.status !== "approved" ? (
                          <span
                            className="flex items-center gap-1 text-[10.5px] text-faint"
                            title={`Only ${row.departmentName} can act on this`}
                          >
                            <LockKeyhole className="h-3 w-3" strokeWidth={1.6} />
                            Read-only
                          </span>
                        ) : null}
                        {row.overrun ? (
                          <span className="font-mono text-[10px] font-medium text-state-blocked">OVERRUN</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="hidden w-[260px] flex-none flex-col overflow-y-auto border-l border-line bg-surface lg:flex">
          <div className="sticky top-0 border-b border-line bg-surface px-4 py-3">
            <Label>Activity as of day {day}</Label>
            <p className="mt-1 text-[10.5px] leading-snug text-faint">
              Computed from the schedule, not a live feed — there&apos;s no backend behind this yet.
            </p>
          </div>
          <ol className="flex-1 px-4 py-3">
            {log.length === 0 ? (
              <li className="text-[11.5px] text-faint">Nothing has happened by day {day} yet.</li>
            ) : (
              log.map((e, i) => (
                <li key={`${e.approvalId}-${e.kind}-${i}`} className="border-b border-line/60 py-2 text-[11.5px] last:border-0">
                  <span className="font-mono text-[10px] text-faint">d{e.day}</span>{" "}
                  <span className="font-mono text-[10px] text-faint">{e.departmentShort}</span>
                  <div className="text-ink">
                    {e.approvalName} — {EVENT_LABEL[e.kind]}
                  </div>
                </li>
              ))
            )}
          </ol>
        </aside>
      </div>
    </div>
  );
}

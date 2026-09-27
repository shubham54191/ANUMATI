"use client";
import { useMemo, useState } from "react";
import { Check, ChevronRight, Clock3, FileLock2, Lock, Minus, PanelRightClose, PanelRightOpen } from "lucide-react";
import type { Roadmap } from "@/types/roadmap";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import {
  buildActivityLog,
  buildTrackRows,
  groupByDepartment,
  type TrackStatus,
} from "@/lib/data/trackState";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * One filled badge per status, the way the reference design draws them: a solid
 * disc in the status colour with a white glyph, not a thin outline glyph. At
 * 12px an outline icon is three grey hairlines and reads as noise; a filled
 * disc still reads as a status at a glance from across a room, which is what a
 * demo screen has to survive.
 */
const STATUS_META: Record<
  TrackStatus,
  { label: string; Icon: typeof Lock; disc: string; ink: string; token: string }
> = {
  locked: {
    label: "Locked",
    Icon: Lock,
    disc: "bg-db-faint",
    ink: "text-db-muted",
    token: "--db-faint",
  },
  active: {
    label: "In progress",
    Icon: Clock3,
    disc: "bg-db-blue",
    ink: "text-db-ink",
    token: "--db-blue",
  },
  query: {
    label: "Query raised",
    Icon: Minus,
    disc: "bg-db-red",
    ink: "text-db-red",
    token: "--db-red",
  },
  approved: {
    label: "Approved",
    Icon: Check,
    disc: "bg-db-green",
    ink: "text-db-ink",
    token: "--db-green",
  },
};

const EVENT_LABEL: Record<string, string> = {
  started: "window opened",
  approved: "approved",
  query_raised: "query raised",
  query_resolved: "query resolved",
};

/** Column widths, shared by the ruler and every lane so the two stay aligned. */
const NAME_W = 248;
const DAYS_W = 88;
const ACT_W = 128;
/** Below this a bar stops being a shape and becomes a smudge. */
const MIN_BAR_PX = 10;

/** A tick every 10 / 25 / 50 … days, whichever gives about five to eight ticks. */
function tickStep(scale: number) {
  for (const s of [5, 10, 25, 50, 100, 200]) if (scale / s <= 8) return s;
  return 250;
}

/**
 * The bar's surface: a vertical light-to-solid gradient in the status colour
 * with a fine diagonal hatch over it. The hatch is what separates a bar that
 * is *measuring* something from a flat coloured rectangle, and it survives
 * being printed in greyscale on a judge's handout.
 */
function barSurface(token: string) {
  return {
    backgroundImage: [
      "repeating-linear-gradient(135deg, rgba(255,255,255,0.26) 0 4px, rgba(255,255,255,0) 4px 9px)",
      `linear-gradient(180deg, color-mix(in srgb, var(${token}) 76%, white) 0%, var(${token}) 100%)`,
    ].join(", "),
  };
}

function StatusBadge({ status, size = 18 }: { status: TrackStatus; size?: number }) {
  const meta = STATUS_META[status];
  return (
    <span
      aria-hidden
      className={cn("flex flex-none items-center justify-center rounded-full", meta.disc)}
      style={{ width: size, height: size }}
    >
      <meta.Icon
        className="text-white"
        style={{ width: size * 0.62, height: size * 0.62 }}
        strokeWidth={3}
      />
    </span>
  );
}

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
        seen.set(a.department_id, {
          id: a.department_id,
          name: a.department_name,
          short: a.department_short,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [roadmap.approvals]);

  const overrunCount = rows.filter((r) => r.overrun).length;

  /**
   * Most of the work sits in the first few weeks and a short tail runs to the
   * end of the critical path, so a single linear axis over the whole 200-odd
   * days squashes three quarters of the bars into a few pixels. "Focus" is a
   * real zoom, not a different truth: the axis is shorter, the day figures on
   * every row stay the same, and a bar that runs off the end is drawn clipped
   * with an arrow rather than silently shortened.
   */
  const focusDays = useMemo(() => {
    const finishes = rows.map((r) => r.finish).sort((a, b) => a - b);
    if (finishes.length === 0) return scaleDays;
    const p = finishes[Math.floor(finishes.length * 0.75)] ?? scaleDays;
    return Math.max(10, Math.ceil((p * 1.1) / 10) * 10);
  }, [rows, scaleDays]);

  const [zoom, setZoom] = useState<"focus" | "all">("focus");
  const canFocus = focusDays < scaleDays * 0.85;
  const axisDays = canFocus && zoom === "focus" ? focusDays : scaleDays;

  const [showActivity, setShowActivity] = useState(false);

  const ticks = useMemo(() => {
    const step = tickStep(axisDays);
    const out: number[] = [];
    for (let d = 0; d <= axisDays; d += step) out.push(d);
    return out;
  }, [axisDays]);

  /**
   * A gridline under every tick on the ruler above, drawn once as a background
   * gradient so thirty-odd lanes do not each carry their own stack of divs.
   */
  const laneGrid = useMemo(() => {
    const stops = ticks
      .map((d) => {
        const p = (d / axisDays) * 100;
        return `transparent ${p}%, var(--db-line) ${p}%, var(--db-line) calc(${p}% + 1px), transparent calc(${p}% + 1px)`;
      })
      .join(", ");
    return { backgroundImage: `linear-gradient(to right, ${stops})` };
  }, [ticks, axisDays]);

  const dayOnAxis = day <= axisDays;
  const dayPct = (Math.min(day, axisDays) / axisDays) * 100;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-db-bg">
      <div className="flex h-[52px] flex-none items-center gap-4 border-b border-db-line bg-surface px-5">
        <span className="flex-none text-[10.5px] font-bold tracking-[0.075em] text-db-muted">
          SIMULATED DAY
        </span>
        <input
          type="range"
          min={0}
          max={scaleDays}
          value={day}
          onChange={(e) => setSimulatedDay(Number(e.target.value))}
          aria-label="Simulated day"
          className="h-1.5 w-[220px] flex-none accent-[color:var(--db-blue)]"
        />
        <span className="font-num flex-none whitespace-nowrap text-[12.5px] text-db-ink">
          Day <span className="font-semibold">{day}</span>{" "}
          <span className="text-db-faint">of {scaleDays}</span>
        </span>
        <span className="h-[18px] w-px flex-none bg-db-line" />

        {isOfficer ? (
          <label className="flex flex-none items-center gap-2 text-[12px] text-db-muted">
            You are
            <select
              value={activeDepartmentId ?? ""}
              onChange={(e) => setActiveDepartmentId(e.target.value || null)}
              className="h-8 rounded-lg border border-db-line bg-surface px-2 text-[12.5px] text-db-ink outline-none focus-visible:ring-2 focus-visible:ring-db-blue"
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
          <span className="truncate text-[12px] text-db-faint">
            All departments, read-only
          </span>
        )}

        <div className="flex-1" />
        {overrunCount > 0 ? (
          <span className="flex-none whitespace-nowrap rounded-full bg-db-red-tint px-2.5 py-1 text-[11.5px] font-semibold text-db-red">
            {overrunCount} SLA breach{overrunCount === 1 ? "" : "es"}
          </span>
        ) : null}

        {canFocus ? (
          <div
            className="flex flex-none items-center rounded-full border border-db-line bg-db-bg p-[2px]"
            role="group"
            aria-label="Timeline scale"
          >
            {(
              [
                ["focus", `0–${focusDays} d`],
                ["all", `0–${scaleDays} d`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setZoom(k)}
                aria-pressed={zoom === k}
                className={cn(
                  "font-num rounded-full px-2.5 py-[3px] text-[11px] font-semibold transition-colors",
                  zoom === k ? "bg-surface text-db-ink shadow-sm" : "text-db-muted hover:text-db-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <button
          onClick={() => setShowActivity((v) => !v)}
          aria-pressed={showActivity}
          className="hidden flex-none items-center gap-1.5 rounded-full border border-db-line bg-surface px-2.5 py-[5px] text-[11.5px] font-medium text-db-muted transition-colors hover:text-db-ink lg:flex"
        >
          {showActivity ? (
            <PanelRightClose className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          Activity
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto">
          {/* legend + ruler, pinned so the scale stays readable while scrolling */}
          <div className="sticky top-0 z-10 border-b border-db-line bg-db-bg/95 px-5 pb-2.5 pt-3 backdrop-blur">
            <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              {(Object.keys(STATUS_META) as TrackStatus[]).map((s) => (
                <span key={s} className="flex items-center gap-2">
                  <StatusBadge status={s} />
                  <span className="text-[12.5px] font-medium text-db-ink">
                    {STATUS_META[s].label}
                  </span>
                </span>
              ))}
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-db-faint/25"
                >
                  <FileLock2 className="h-[11px] w-[11px] text-db-muted" strokeWidth={2.2} />
                </span>
                <span className="text-[12.5px] font-medium text-db-ink">
                  Locked by another department
                </span>
              </span>
            </div>

            <div className="flex items-end gap-3">
              <span
                className="flex-none text-[10px] font-bold tracking-[0.075em] text-db-faint"
                style={{ width: NAME_W }}
              >
                DAYS FROM FILING
              </span>
              <div className="relative h-4 min-w-0 flex-1">
                {ticks.map((d) => {
                  // The day pill sits on the same line; drop any tick it would
                  // land on top of rather than printing two labels in one spot.
                  const p = (d / axisDays) * 100;
                  if (dayOnAxis && Math.abs(p - dayPct) < 9) return null;
                  return (
                    <span
                      key={d}
                      className="font-num absolute bottom-0 -translate-x-1/2 text-[10.5px] text-db-faint first:translate-x-0"
                      style={{ left: `${p}%` }}
                    >
                      {d}
                    </span>
                  );
                })}
                {dayOnAxis ? (
                  <span
                    className="font-num absolute bottom-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-db-blue px-1.5 py-[1px] text-[10px] font-semibold text-white"
                    style={{ left: `${dayPct}%` }}
                  >
                    {day}
                  </span>
                ) : null}
              </div>
              <span className="flex-none" style={{ width: DAYS_W }} />
              {isOfficer ? (
                <span className="hidden flex-none lg:block" style={{ width: ACT_W }} />
              ) : null}
            </div>
          </div>

          <div className="px-5 pb-4 pt-1">
            {groups.map((g, gi) => (
              <section
                key={g.departmentId}
                className={cn("py-3", gi > 0 && "border-t border-db-line")}
              >
                <header className="mb-2 flex items-baseline gap-1.5">
                  <h3 className="text-[13.5px] font-bold leading-none text-db-ink">
                    {g.departmentName}
                  </h3>
                  <span className="text-[11px] leading-none text-db-faint">
                    ({g.departmentShort})
                  </span>
                </header>

                <div className="flex flex-col gap-[3px]">
                  {g.rows.map((row) => {
                    const meta = STATUS_META[row.status];
                    const canAct =
                      isOfficer &&
                      activeDepartmentId === row.departmentId &&
                      (row.status === "active" || row.status === "query");
                    const token = row.overrun ? "--db-red" : meta.token;
                    // Everything below is clamped to the visible axis. The day
                    // figures printed on the right stay the true ones.
                    const offAxis = row.start >= axisDays;
                    const clipped = row.finish > axisDays;
                    const leftPct = (Math.min(row.start, axisDays) / axisDays) * 100;
                    const widthPct =
                      ((Math.min(row.finish, axisDays) - Math.min(row.start, axisDays)) /
                        axisDays) *
                      100;
                    const fillPct = row.slaPct * 100;

                    return (
                      <div
                        key={row.approvalId}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-1.5 py-[3px] transition-colors",
                          selectedId === row.approvalId ? "bg-db-blue-tint" : "hover:bg-surface",
                        )}
                      >
                        <button
                          onClick={() => select(row.approvalId === selectedId ? null : row.approvalId)}
                          className="flex flex-none items-center gap-2 truncate text-left focus-visible:outline-none"
                          style={{ width: NAME_W }}
                          title={row.approvalName}
                        >
                          <StatusBadge status={row.status} size={17} />
                          <span
                            className={cn(
                              "truncate text-[12.5px] font-medium",
                              row.status === "locked" ? "text-db-muted" : "text-db-ink",
                            )}
                          >
                            {row.approvalName}
                          </span>
                          {row.onCriticalPath ? (
                            <span className="flex-none rounded-full bg-db-red-tint px-1.5 text-[9px] font-bold tracking-[0.04em] text-db-red">
                              CP
                            </span>
                          ) : null}
                        </button>

                        {/* the full timeline, as a track; the bar inside it is the
                            statutory window, positioned on the real day axis */}
                        <div
                          className="relative h-[22px] min-w-0 flex-1 rounded-full bg-db-line/60"
                          style={laneGrid}
                        >
                          {dayOnAxis ? (
                            <span
                              aria-hidden
                              className="absolute inset-y-[1px] w-px bg-db-navy/35"
                              style={{ left: `${dayPct}%` }}
                            />
                          ) : null}

                          {offAxis ? (
                            <span
                              className="font-num absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-[10px] font-semibold text-db-faint"
                              title={`Starts on day ${row.start}, past the end of this scale`}
                            >
                              <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
                              d{row.start}
                            </span>
                          ) : (
                            <div
                              className={cn(
                                "absolute top-[2px] h-[18px] overflow-hidden rounded-full",
                                clipped && "rounded-r-none",
                              )}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                minWidth: MIN_BAR_PX,
                                // the unspent part of the window: the same hue,
                                // washed out, so an untouched row still reads as
                                // a shape on the axis instead of vanishing
                                background: `color-mix(in srgb, var(${token}) 24%, white)`,
                              }}
                              title={`${row.approvalName} · day ${row.start} to ${row.finish} · ${row.statutoryDays} day window`}
                            >
                              <div
                                className={cn(
                                  "h-full rounded-full transition-[width] duration-300",
                                  clipped && "rounded-r-none",
                                )}
                                style={{ width: `${fillPct}%`, ...barSurface(token) }}
                              />
                            </div>
                          )}
                        </div>

                        <span
                          className="font-num flex-none whitespace-nowrap text-right text-[11.5px] text-db-muted"
                          style={{ width: DAYS_W }}
                        >
                          <span className="font-semibold text-db-ink">{row.statutoryDays}</span> d
                          <span className="ml-1 text-db-faint">
                            ({row.start}–{row.finish})
                          </span>
                        </span>

                        <div
                          className={cn(
                            "flex-none items-center justify-end gap-1.5 lg:flex",
                            isOfficer ? "hidden" : "hidden lg:hidden",
                          )}
                          style={{ width: ACT_W }}
                        >
                          {canAct ? (
                            row.status === "active" ? (
                              <Button
                                variant="ghost"
                                className="h-6 px-2 text-[11px]"
                                onClick={() => raiseQuery(row.approvalId)}
                              >
                                Raise a query
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                className="h-6 px-2 text-[11px]"
                                onClick={() => resolveQuery(row.approvalId)}
                              >
                                Resolve query
                              </Button>
                            )
                          ) : isOfficer && row.status !== "locked" && row.status !== "approved" ? (
                            <span
                              className="flex items-center gap-1 text-[10.5px] text-db-faint"
                              title={`Only ${row.departmentName} can act on this`}
                            >
                              <FileLock2 className="h-3 w-3" strokeWidth={2} />
                              Read-only
                            </span>
                          ) : null}
                          {row.overrun ? (
                            <span className="rounded-full bg-db-red-tint px-1.5 py-[1px] text-[9.5px] font-bold tracking-[0.04em] text-db-red">
                              OVERRUN
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside
          className={cn(
            "w-[268px] flex-none flex-col overflow-y-auto border-l border-db-line bg-surface",
            showActivity ? "hidden lg:flex" : "hidden",
          )}
        >
          <div className="sticky top-0 border-b border-db-line bg-surface px-4 py-3">
            <span className="text-[10.5px] font-bold tracking-[0.075em] text-db-muted">
              ACTIVITY AS OF DAY {day}
            </span>
            <p className="mt-1 text-[10.5px] leading-snug text-db-faint">
              Computed from the schedule, not a live feed — there&apos;s no backend behind this yet.
            </p>
          </div>
          <ol className="flex-1 px-4 py-3">
            {log.length === 0 ? (
              <li className="text-[11.5px] text-db-faint">Nothing has happened by day {day} yet.</li>
            ) : (
              log.map((e, i) => (
                <li
                  key={`${e.approvalId}-${e.kind}-${i}`}
                  className="border-b border-db-line/70 py-2 text-[11.5px] last:border-0"
                >
                  <span className="font-num font-mono text-[10px] text-db-faint">d{e.day}</span>{" "}
                  <span className="font-mono text-[10px] text-db-faint">{e.departmentShort}</span>
                  <div className="text-db-ink">
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

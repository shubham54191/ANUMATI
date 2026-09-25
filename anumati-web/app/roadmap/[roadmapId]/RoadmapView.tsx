"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Clock,
  FileText,
  Maximize2,
  Pencil,
  Plus,
  Printer,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ApprovalDetailPanel } from "@/components/roadmap/ApprovalDetailPanel";
import { ClockToggle } from "@/components/roadmap/ClockToggle";
import { BoardHeader } from "@/components/roadmap/board/BoardHeader";
import { BoardTabs } from "@/components/roadmap/board/BoardTabs";
import { CriticalPathStrip } from "@/components/roadmap/board/CriticalPathStrip";
import { DependencyEvidenceCard } from "@/components/roadmap/board/DependencyEvidenceCard";
import { DependencyTypeCard } from "@/components/roadmap/board/DependencyTypeCard";
import { KeyInsightsCard } from "@/components/roadmap/board/KeyInsightsCard";
import { StatCard, Delta } from "@/components/roadmap/board/StatCard";
import { TimeSavedCard } from "@/components/roadmap/board/TimeSavedCard";
import { RoadmapGraph } from "@/components/graph/RoadmapGraph";
import { ApprovalRegister } from "@/components/register/ApprovalRegister";
import { DocumentLedger } from "@/components/documents/DocumentLedger";
import { WorkflowTrack } from "@/components/track/WorkflowTrack";
import { PreCheckPane } from "@/components/precheck/PreCheckPane";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { useReportsStore } from "@/store/useReportsStore";
import { daysUnder, evidenceIndex } from "@/lib/data/observed";
import { APPROVALS } from "@/lib/data/maharashtraFood";
import { SEEDED_REPORTS } from "@/lib/data/fieldReports";
import { getRoadmapSync } from "@/lib/api/roadmap";
import { DEFAULT_REQUEST } from "@/lib/data/engine";
import { SECTORS, SIZE_BANDS, STAGES } from "@/lib/constants/sectors";
import { LOCATIONS } from "@/lib/constants/locations";

const labelOf = (opts: readonly { id: string; label: string }[], id: string) =>
  opts.find((o) => o.id === id)?.label ?? id;

const bandFor = (employees: number) =>
  employees < 10 ? SIZE_BANDS[0] : employees <= 50 ? SIZE_BANDS[1] : employees <= 100 ? SIZE_BANDS[2] : SIZE_BANDS[3];

const SETUP_FLAGS = ["boiler", "hazardous", "export", "contract_labour"] as const;

function ApplySetupChoices() {
  const searchParams = useSearchParams();
  const hydrateFromSetup = useRoadmapStore((s) => s.hydrateFromSetup);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;

    const employeesParam = searchParams.get("employees");
    const heightParam = searchParams.get("heightM");
    const on: Record<string, boolean> = {};
    for (const key of SETUP_FLAGS) {
      if (searchParams.get(key) === "1") on[key] = true;
    }
    // Land regime is a three-state answer on the wire: absent means "leave it
    // alone", 1 and 0 are explicit, because "not MIDC" is a real answer and
    // must not be confused with "not asked".
    const landParam = searchParams.get("midc_land");
    if (landParam === "1" || landParam === "0") on.midc_land = landParam === "1";

    const paneParam = searchParams.get("pane");
    if (
      paneParam === "register" ||
      paneParam === "documents" ||
      paneParam === "graph" ||
      paneParam === "track" ||
      paneParam === "precheck"
    ) {
      useRoadmapStore.getState().setPane(paneParam);
    }
    const roleParam = searchParams.get("role");
    if (roleParam === "department" || roleParam === "applicant") {
      useRoadmapStore.getState().setViewMode(roleParam);
    }

    if (employeesParam || heightParam || Object.keys(on).length) {
      hydrateFromSetup({
        employees: employeesParam ? Number(employeesParam) : undefined,
        heightM: heightParam ? Number(heightParam) : undefined,
        on: Object.keys(on).length ? on : undefined,
      });
    }
  }, [searchParams, hydrateFromSetup]);

  return null;
}

export function RoadmapView({ roadmapId }: { roadmapId: string }) {
  const conditions = useRoadmapStore((s) => s.conditions);
  const viewMode = useRoadmapStore((s) => s.viewMode);
  const pane = useRoadmapStore((s) => s.pane);
  const setPane = useRoadmapStore((s) => s.setPane);
  const employees = useRoadmapStore((s) => s.employees);
  const fitGraph = useRoadmapStore((s) => s.fitGraph);
  const expandGraph = useRoadmapStore((s) => s.expandGraph);

  const clockBasis = useRoadmapStore((s) => s.clockBasis);
  const filed = useReportsStore((s) => s.filed);
  const hydrateReports = useReportsStore((s) => s.hydrate);
  useEffect(() => hydrateReports(), [hydrateReports]);

  // Reports filed in this session sit alongside the seeded ones, so filing a
  // delay visibly moves the median it feeds — that is the loop, not a form.
  const evidence = useMemo(
    () => evidenceIndex(APPROVALS, [...filed, ...SEEDED_REPORTS]),
    [filed],
  );

  const { data: roadmap, meta } = useMemo(
    () =>
      getRoadmapSync({ ...DEFAULT_REQUEST, conditions }, (a) =>
        daysUnder(a, clockBasis, evidence),
      ),
    [conditions, clockBasis, evidence],
  );

  const req = DEFAULT_REQUEST;
  const isOfficer = viewMode === "department";

  const saved = roadmap.sequential_days - roadmap.optimised_days;
  const savedPct = roadmap.sequential_days ? (saved / roadmap.sequential_days) * 100 : 0;
  const departments = new Set(roadmap.approvals.map((a) => a.department_id)).size;
  const flagged = roadmap.approvals.filter((a) => a.flagged).length;

  const sector = labelOf(SECTORS, req.sector);
  const location = labelOf(LOCATIONS, req.location);
  const stage = labelOf(STAGES, req.stage);
  const subtitle = `${sector} — ${location}`;

  const printChecklist = () => {
    setPane("register");
    window.setTimeout(() => window.print(), 80);
  };

  return (
    <AppShell active="roadmap" meta={meta} variant="board" subtitle={subtitle}>
      <Suspense fallback={null}>
        <ApplySetupChoices />
      </Suspense>

      <div className="relative flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bg-db-bg print:overflow-visible print:bg-white">
          <div className="mx-auto w-full max-w-[1560px] px-7 py-6 print:px-0 print:py-0">
            <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
              <BoardHeader
                subtitle={`${sector} — ${location} · ${bandFor(employees).label}`}
                stage={stage}
              />
              <ClockToggle evidence={evidence} />
            </div>

            {/* the four numbers, and the evidence behind them */}
            <div className="mt-5 flex flex-wrap items-stretch gap-4 print:hidden">
              <div className="flex min-w-[620px] flex-1 flex-wrap gap-4">
                <StatCard
                  tone="blue"
                  Icon={FileText}
                  label="Total Approvals"
                  value={roadmap.approvals.length}
                  unit={`across ${departments} departments`}
                />
                <StatCard
                  tone="green"
                  Icon={CalendarDays}
                  label="If done sequentially"
                  value={roadmap.sequential_days}
                  unit="days"
                />
                <StatCard
                  tone="purple"
                  Icon={Clock}
                  label="Optimised (critical path)"
                  value={roadmap.optimised_days}
                  unit="days"
                  badge={<Delta>↓ {savedPct.toFixed(1)}%</Delta>}
                />
                <StatCard
                  tone="emerald"
                  Icon={CircleCheck}
                  label="Time Saved"
                  value={saved}
                  unit="days"
                  badge={
                    <span className="text-[12px] font-medium text-db-green">
                      (≈ {savedPct.toFixed(1)}%)
                    </span>
                  }
                />
              </div>
              <DependencyEvidenceCard dependencies={roadmap.dependencies} />
            </div>

            {/* board and rail */}
            <div className="mt-5 flex flex-wrap items-start gap-4">
              <div className="min-w-[660px] flex-1 rounded-xl border border-db-line bg-surface print:border-0">
                <div className="print:hidden">
                  <BoardTabs approvalCount={roadmap.approvals.length} />
                </div>

                {pane === "graph" ? (
                  <div className="flex flex-col gap-4 p-5 print:hidden">
                    <CriticalPathStrip roadmap={roadmap} />

                    <div className="rounded-xl border border-db-line">
                      <div className="flex h-[52px] items-center gap-2 border-b border-db-line px-4">
                        <span className="text-[14px] font-semibold text-db-ink">
                          Dependency Graph
                        </span>
                        <div className="flex-1" />
                        <button
                          onClick={expandGraph}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-db-line px-3 text-[12px] text-db-muted transition-colors hover:border-db-blue/40 hover:text-db-blue"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Expand all
                        </button>
                        <button
                          onClick={fitGraph}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-db-line px-3 text-[12px] text-db-muted transition-colors hover:border-db-blue/40 hover:text-db-blue"
                        >
                          <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Fit to screen
                        </button>
                      </div>
                      <div className="h-[560px] w-full overflow-hidden rounded-b-xl">
                        <RoadmapGraph roadmap={roadmap} />
                      </div>
                    </div>
                  </div>
                ) : null}

                {pane === "track" ? (
                  <div className="h-[680px] overflow-hidden rounded-b-xl print:hidden">
                    <WorkflowTrack roadmap={roadmap} />
                  </div>
                ) : null}

                {pane === "register" ? (
                  <div className="h-[760px] overflow-hidden rounded-b-xl print:h-auto print:overflow-visible">
                    <ApprovalRegister roadmap={roadmap} evidence={evidence} />
                  </div>
                ) : null}

                {pane === "documents" ? (
                  <div className="h-[760px] overflow-hidden rounded-b-xl print:hidden">
                    <DocumentLedger roadmap={roadmap} />
                  </div>
                ) : null}

                {pane === "precheck" ? (
                  <div className="h-[760px] overflow-hidden rounded-b-xl print:hidden">
                    <PreCheckPane roadmap={roadmap} />
                  </div>
                ) : null}
              </div>

              <div className="flex w-[296px] flex-none flex-col gap-4 print:hidden">
                <DependencyTypeCard roadmap={roadmap} />
                <KeyInsightsCard roadmap={roadmap} />
                <TimeSavedCard roadmap={roadmap} />
              </div>
            </div>

            {/* the line that keeps the numbers honest, and the two actions */}
            <div className="mt-4 flex flex-wrap items-center gap-3 pb-2 print:hidden">
              <span className="font-mono text-[11px] text-db-faint">{roadmapId}</span>
              <span className="h-3.5 w-px bg-db-line" />
              <span className="text-[12px] text-db-muted">
                Rules {meta.rules_version} · {roadmap.approvals.length} approvals ·{" "}
                <span className={flagged ? "text-db-red" : undefined}>{flagged} flagged</span> ·
                engine {meta.engine_version}
              </span>
              <Link
                href="/roadmap/new"
                title="Change the four answers"
                className="flex h-7 items-center gap-1.5 rounded-lg border border-db-line px-2.5 text-[11.5px] text-db-muted no-underline transition-colors hover:border-db-blue/40 hover:text-db-blue"
              >
                <Pencil className="h-3 w-3" strokeWidth={1.6} />
                Change answers
              </Link>

              <div className="flex-1" />

              <button
                onClick={printChecklist}
                className="flex h-9 items-center gap-2 rounded-lg border border-db-line bg-surface px-3.5 text-[12.5px] text-db-ink transition-colors hover:border-db-blue/40"
              >
                <Printer className="h-3.5 w-3.5" strokeWidth={1.6} />
                Print checklist
              </button>

              {isOfficer ? (
                <Link
                  href={`/roadmap/${roadmapId}/simulate`}
                  className="flex h-9 items-center gap-2 rounded-lg bg-db-navy px-3.5 text-[12.5px] font-medium text-white no-underline transition-colors hover:bg-db-ink"
                >
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Simulate reforms
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <ApprovalDetailPanel roadmap={roadmap} evidence={evidence} />
      </div>
    </AppShell>
  );
}

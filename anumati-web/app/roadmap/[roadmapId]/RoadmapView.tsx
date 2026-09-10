"use client";
import { Suspense, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Pencil, Printer } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PaneSwitch } from "@/components/layout/PaneSwitch";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { RoadmapHeader } from "@/components/roadmap/RoadmapHeader";
import { ConditionalControls } from "@/components/roadmap/ConditionalControls";
import { ApprovalDetailPanel } from "@/components/roadmap/ApprovalDetailPanel";
import { RoadmapGraph } from "@/components/graph/RoadmapGraph";
import { ApprovalRegister } from "@/components/register/ApprovalRegister";
import { DocumentLedger } from "@/components/documents/DocumentLedger";
import { WorkflowTrack } from "@/components/track/WorkflowTrack";
import { useRoadmapStore } from "@/store/useRoadmapStore";
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

    const paneParam = searchParams.get("pane");
    if (paneParam === "register" || paneParam === "documents" || paneParam === "graph" || paneParam === "track") {
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

  const { data: roadmap, meta } = useMemo(
    () => getRoadmapSync({ ...DEFAULT_REQUEST, conditions }),
    [conditions],
  );

  const req = DEFAULT_REQUEST;
  const isOfficer = viewMode === "department";

  const printChecklist = () => {
    setPane("register");
    window.setTimeout(() => window.print(), 80);
  };

  return (
    <AppShell active="roadmap" meta={meta}>
      <Suspense fallback={null}>
        <ApplySetupChoices />
      </Suspense>
      {}
      <div className="flex h-[52px] flex-none items-center gap-3 border-b border-line bg-surface px-5 print:hidden">
        <span className="font-mono text-[11px] flex-none whitespace-nowrap text-muted">
          {roadmapId}
        </span>
        <span className="h-[18px] w-px flex-none bg-line" />
        <div className="flex min-w-0 items-center gap-2 truncate whitespace-nowrap text-[13px] text-ink">
          <span className="font-medium">{labelOf(SECTORS, req.sector)}</span>
          <span className="text-line-strong">/</span>
          <span>{labelOf(LOCATIONS, req.location)}</span>
          <span className="text-line-strong">/</span>
          <span>{bandFor(employees).label}</span>
          <span className="text-line-strong">/</span>
          <span>{labelOf(STAGES, req.stage)}</span>
        </div>
        <Link href="/roadmap/new" className="flex-none no-underline" title="Change the four answers">
          <Button variant="ghost" aria-label="Change the four answers" className="h-[26px] w-[26px] flex-none border border-line p-0">
            <Pencil className="h-3 w-3" strokeWidth={1.4} />
          </Button>
        </Link>

        <div className="flex-1" />

        <PaneSwitch />
        <Button onClick={printChecklist} className="flex-none whitespace-nowrap">
          <Printer className="h-3 w-3" strokeWidth={1.4} />
          Print checklist
        </Button>

        {}
        {isOfficer ? (
          <Link href={`/roadmap/${roadmapId}/simulate`} className="flex-none no-underline">
            <Button variant="primary" className="flex-none whitespace-nowrap">
              <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
              Simulate reforms
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="print:hidden">
        <RoadmapHeader roadmap={roadmap} />
        <ConditionalControls engineVersion={meta.engine_version} />
      </div>

      <main className="relative flex-1 overflow-hidden">
        {pane === "graph" ? <RoadmapGraph roadmap={roadmap} /> : null}
        {pane === "register" ? <ApprovalRegister roadmap={roadmap} /> : null}
        {pane === "documents" ? <DocumentLedger roadmap={roadmap} /> : null}
        {pane === "track" ? <WorkflowTrack roadmap={roadmap} /> : null}
        <ApprovalDetailPanel roadmap={roadmap} />
      </main>
    </AppShell>
  );
}

"use client";
import { useEffect } from "react";
import { derive } from "@/lib/matrix/engine";
import { useMatrixStore } from "@/store/useMatrixStore";
import { ApplicationQueue } from "@/components/matrix/ApplicationQueue";
import { ConflictBanner } from "@/components/matrix/ConflictBanner";
import { ConflictResolutionScreen } from "@/components/matrix/ConflictResolutionScreen";
import { ContextPanel } from "@/components/matrix/ContextPanel";
import { DecisionBar } from "@/components/matrix/DecisionBar";
import { FileHeader } from "@/components/matrix/FileHeader";
import { OfficerTopBar } from "@/components/matrix/OfficerTopBar";
import { ParallelTrack } from "@/components/matrix/ParallelTrack";
import { PhaseSummary } from "@/components/matrix/PhaseSummary";
import { RevisionPacketDialog } from "@/components/matrix/RevisionPacketDialog";
import { TieBreakerScreen } from "@/components/matrix/TieBreakerScreen";

/** One simulated day per tick when the clock is running. */
const TICK_MS = 1400;

export function MatrixConsole() {
  const applications = useMatrixStore((s) => s.applications);
  const selectedId = useMatrixStore((s) => s.selectedId);
  const clockRunning = useMatrixStore((s) => s.clockRunning);
  const advance = useMatrixStore((s) => s.advance);
  const toggleClock = useMatrixStore((s) => s.toggleClock);
  const tieBreakerOpen = useMatrixStore((s) => s.tieBreakerOpen);

  const fetchAllRecords = useMatrixStore((s) => s.fetchAllRecords);

  const app = applications.find((a) => a.id === selectedId) ?? applications[0];
  const derived = derive(app);

  // Automated background validation. A dispatched file does not wait for an
  // officer to press anything: the shared data matrix calls each ministry of
  // record itself, and whatever comes back — including a record that
  // contradicts the file — is on screen before anyone asks for it.
  const needsValidation = app.dispatched && app.records.every((r) => r.state === "idle");
  useEffect(() => {
    if (needsValidation) fetchAllRecords();
  }, [needsValidation, selectedId, fetchAllRecords]);

  // The clock stops itself once there is nothing left for it to move.
  const idle = derived.pending.length === 0 || Boolean(app.resolution);
  useEffect(() => {
    if (!clockRunning) return;
    if (idle) {
      toggleClock();
      return;
    }
    const handle = window.setInterval(() => advance(1), TICK_MS);
    return () => window.clearInterval(handle);
  }, [clockRunning, idle, advance, toggleClock]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <OfficerTopBar />

      <div className="flex min-h-0 flex-1">
        <ApplicationQueue />

        <main className="flex min-w-0 flex-1 flex-col">
          <ConflictBanner app={app} derived={derived} />

          <div className="min-h-0 flex-1 overflow-y-auto">
            <FileHeader app={app} derived={derived} />
            <ParallelTrack app={app} derived={derived} />
            {derived.conflict && !app.resolution ? (
              <ConflictResolutionScreen app={app} derived={derived} />
            ) : (
              <PhaseSummary app={app} derived={derived} />
            )}
          </div>

          <DecisionBar key={app.id} app={app} />
        </main>

        <ContextPanel key={app.id} app={app} derived={derived} />
      </div>

      {tieBreakerOpen ? <TieBreakerScreen app={app} derived={derived} /> : null}
      <RevisionPacketDialog app={app} />
    </div>
  );
}

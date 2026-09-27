"use client";
import { useEffect } from "react";
import { AlertTriangle, Inbox, Loader2, X } from "lucide-react";
import { derive } from "@/lib/matrix/engine";
import { useMatrixStore } from "@/store/useMatrixStore";
import { subscribe } from "@/lib/api/client";
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
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";

/** One simulated day per tick when the clock is running. */
const TICK_MS = 1400;

/** Errors from the server, said once, dismissable, never a blank screen. */
function ErrorToast() {
  const error = useMatrixStore((s) => s.error);
  const clear = useMatrixStore((s) => s.clearError);
  if (!error) return null;
  return (
    <div
      role="alert"
      className="db-drop fixed bottom-24 left-1/2 z-50 flex max-w-[560px] -translate-x-1/2 items-start gap-2.5 rounded-xl border border-db-red-line bg-surface px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-db-red" strokeWidth={1.8} />
      <p className="text-[13px] leading-snug text-db-ink">{error}</p>
      <button onClick={clear} aria-label="Dismiss" className="ml-2 flex-none text-db-faint hover:text-db-ink">
        <X className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

export function MatrixConsole() {
  const mode = useMatrixStore((s) => s.mode);
  const loading = useMatrixStore((s) => s.loading);
  const load = useMatrixStore((s) => s.load);
  const refresh = useMatrixStore((s) => s.refresh);
  const applications = useMatrixStore((s) => s.applications);
  const selectedId = useMatrixStore((s) => s.selectedId);

  // Live mode: load the files this officer may see, then follow every change
  // the server commits — another desk's decision, the clock, a registry answer.
  useEffect(() => {
    if (mode !== "live") return;
    void load();
    return subscribe((id) => void refresh(id));
  }, [mode, load, refresh]);

  const app = applications.find((a) => a.id === selectedId) ?? applications[0];

  if (!app) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-db-bg">
        <OfficerTopBar />
        <div className="flex flex-1 items-center justify-center">
          {loading ? (
            <span className="flex items-center gap-2 text-[13px] text-db-muted">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} /> Loading your files…
            </span>
          ) : (
            <div className="flex max-w-[420px] flex-col items-center gap-3 text-center">
              <Inbox className="h-8 w-8 text-db-faint" strokeWidth={1.5} />
              <p className="text-[15px] font-semibold text-db-ink">Nothing on your desk</p>
              <p className="text-[13px] leading-relaxed text-db-muted">
                A file appears here the moment it is dispatched to your department. Nothing is waiting on you now.
              </p>
            </div>
          )}
        </div>
        <ErrorToast />
      </div>
    );
  }

  return <Console app={app} derived={derive(app)} />;
}

function Console({ app, derived }: { app: ApplicationFile; derived: DerivedMatrixState }) {
  const mode = useMatrixStore((s) => s.mode);
  const selectedId = useMatrixStore((s) => s.selectedId);
  const clockRunning = useMatrixStore((s) => s.clockRunning);
  const advance = useMatrixStore((s) => s.advance);
  const toggleClock = useMatrixStore((s) => s.toggleClock);
  const tieBreakerOpen = useMatrixStore((s) => s.tieBreakerOpen);
  const fetchAllRecords = useMatrixStore((s) => s.fetchAllRecords);

  // Automated background validation. A dispatched file does not wait for an
  // officer to press anything: the shared data matrix calls each ministry of
  // record itself. In live mode the server's worker does this on dispatch.
  const needsValidation = mode === "demo" && app.dispatched && app.records.every((r) => r.state === "idle");
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
    <div className="flex h-screen flex-col overflow-hidden bg-db-bg">
      <OfficerTopBar />

      <div className="flex min-h-0 flex-1">
        <ApplicationQueue />

        {/* Two siblings, two distinct keys. Giving both the bare file id made
            them duplicate keys, and React then appended the new file's pane
            instead of replacing the old one — every file switch stacked
            another whole file on the screen. The warning that catches this is
            stripped from a production build, so it only showed as a bug. */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div key={`file-${app.id}`} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-4">
              <ConflictBanner app={app} derived={derived} />
              <FileHeader app={app} derived={derived} />
              <ParallelTrack app={app} derived={derived} />
              {derived.conflict && !app.resolution ? (
                <ConflictResolutionScreen app={app} derived={derived} />
              ) : (
                <PhaseSummary app={app} derived={derived} />
              )}
            </div>
          </div>

          <DecisionBar key={`bar-${app.id}`} app={app} />
        </main>

        <ContextPanel key={app.id} app={app} derived={derived} />
      </div>

      {tieBreakerOpen ? <TieBreakerScreen app={app} derived={derived} /> : null}
      <RevisionPacketDialog app={app} />
      <ErrorToast />
    </div>
  );
}

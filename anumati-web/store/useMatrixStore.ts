"use client";
import { create } from "zustand";
import type { ApplicationFile, DataRecordState } from "@/types/matrix";
import { seedApplications } from "@/lib/matrix/applications";
import type { DecisionInput } from "@/lib/matrix/engine";
import {
  advanceDay,
  decide as decideOn,
  derive,
  dispatch as dispatchFile,
  escalateToTieBreaker,
  failOnScore,
  finalise as finaliseFile,
  isOpen,
  postMessage,
  reEvaluate as reEvaluateDept,
  sendForRevision as sendForRevisionOn,
  setRecordState,
  tieBreakerDecision,
  verifyParameters as verifyParametersOn,
} from "@/lib/matrix/engine";

export type ContextTab = "thread" | "data" | "scope" | "sla" | "visits" | "redress" | "audit";

interface MatrixState {
  applications: ApplicationFile[];
  selectedId: string;
  tab: ContextTab;
  /** The clarification thread is composed from the console as one department. */
  speakingAs: string | null;
  clockRunning: boolean;
  tieBreakerOpen: boolean;
  packetOpen: boolean;

  select: (id: string) => void;
  setTab: (t: ContextTab) => void;
  setSpeakingAs: (deptId: string | null) => void;
  setTieBreakerOpen: (open: boolean) => void;
  setPacketOpen: (open: boolean) => void;

  dispatchAll: () => void;
  decide: (deptId: string, state: "approved" | "rejected", opts?: { score?: number; remarks?: string }) => void;
  triggerClash: () => void;
  reEvaluate: (deptId: string, note: string) => void;
  verifyParameters: (deptId: string) => void;
  post: (body: string, deptId: string | null) => void;

  toggleClock: () => void;
  advance: (days?: number) => void;

  sendForRevision: () => void;
  escalate: () => void;
  tieBreak: (outcome: "overrule" | "sustain", by: string, note: string) => void;
  failScore: () => void;
  finalise: () => void;

  fetchRecord: (recordId: string) => void;
  fetchAllRecords: () => void;
  patchRecord: (appId: string, recordId: string, state: DataRecordState, value: string | null) => void;

  resetFile: () => void;
}

/**
 * Deterministic answers from the shared data matrix. A real deployment calls
 * the ministry of record; the shape of what comes back is the same either way,
 * including the case that matters most — a record that contradicts the file.
 */
const RECORD_ANSWERS: Record<string, { state: DataRecordState; value: string }> = {
  "DR-PAN-GST": {
    state: "verified",
    value: "GSTIN 27AABCT1332L1ZQ active · returns filed to Aug 2026 · no demand outstanding",
  },
  "DR-LAND": {
    state: "verified",
    value: "Parcel PN-CHK-114/2A · NA order 2025/NA/4471 dated 12 Mar 2025 · no encumbrance",
  },
  "DR-PROMOTER": {
    state: "verified",
    value: "2 promoters · no adverse record · no disqualification under s. 164",
  },
  "DR-EPFO": {
    state: "verified",
    value: "Code MHPUN2249081 · contributions current to Aug 2026 · no default",
  },
  "DR-CLOUD": {
    state: "mismatch",
    value:
      "42 vCPU / 6 TB already allotted to this cluster on MahaGov Cloud and unused. The file proposes 18 on-premise racks against a cloud-first allocation.",
  },
};

const NOTE_ON_CONFLICT =
  "Conflict Resolution Protocol opened this thread. Both departments can settle the objection here; a withdrawn rejection re-enters the pipeline as processing.";

export const useMatrixStore = create<MatrixState>((set, get) => ({
  applications: seedApplications(),
  selectedId: seedApplications()[0].id,
  tab: "thread",
  speakingAs: null,
  clockRunning: false,
  tieBreakerOpen: false,
  packetOpen: false,

  // Switching files stops the clock and drops the previous file's composer
  // identity — the clock advances whichever file is selected, so leaving it
  // running would age a file the officer only glanced at.
  select: (id) =>
    set({
      selectedId: id,
      tab: "thread",
      tieBreakerOpen: false,
      packetOpen: false,
      clockRunning: false,
      speakingAs: null,
    }),
  setTab: (tab) => set({ tab }),
  setSpeakingAs: (speakingAs) => set({ speakingAs }),
  setTieBreakerOpen: (tieBreakerOpen) => set({ tieBreakerOpen }),
  setPacketOpen: (packetOpen) => set({ packetOpen }),

  dispatchAll: () => update(set, get, (app) => dispatchFile(app)),

  decide: (deptId, state, opts) =>
    update(set, get, (app) =>
      openThreadOnConflict(
        app,
        decideOn(app, [{ dept_id: deptId, state, score: opts?.score, remarks: opts?.remarks }]),
      ),
    ),

  /**
   * The case the protocol exists for: two departments committing opposite
   * decisions on the same file at the same instant.
   */
  triggerClash: () =>
    update(set, get, (app) => {
      // Only desks that are still open get a decision — replaying the clash
      // after one side has withdrawn should not silently rewrite the other.
      const inputs: DecisionInput[] = [];
      const approver = app.reviews.find((r) => r.dept_id === app.demo.approver_dept);
      const rejecter = app.reviews.find((r) => r.dept_id === app.demo.rejecter_dept);
      if (approver && isOpen(approver)) {
        inputs.push({
          dept_id: approver.dept_id,
          state: "approved",
          remarks: app.demo.approver_note,
          score: app.demo.approver_score,
        });
      }
      if (rejecter && isOpen(rejecter)) {
        inputs.push({
          dept_id: rejecter.dept_id,
          state: "rejected",
          remarks: app.demo.rejection_reason,
          score: app.demo.rejecter_score,
        });
      }
      return openThreadOnConflict(app, decideOn(app, inputs));
    }),

  reEvaluate: (deptId, note) => {
    update(set, get, (app) => reEvaluateDept(app, deptId, note));
    set({ tieBreakerOpen: false });
  },

  verifyParameters: (deptId) => update(set, get, (app) => verifyParametersOn(app, deptId)),

  post: (body, deptId) =>
    update(set, get, (app) => {
      const dept = app.reviews.find((r) => r.dept_id === deptId);
      return postMessage(app, {
        author: dept ? `${dept.officer_name}` : "Single-window officer",
        author_short: dept ? dept.dept_short : "SINGLE WINDOW",
        role: dept ? "department" : "officer",
        dept_id: dept?.dept_id ?? null,
        body,
      });
    }),

  toggleClock: () => set((s) => ({ clockRunning: !s.clockRunning })),
  advance: (days = 1) => update(set, get, (app) => advanceDay(app, days)),

  sendForRevision: () => {
    update(set, get, (app) => sendForRevisionOn(app));
    set({ packetOpen: true, clockRunning: false });
  },

  escalate: () => {
    update(set, get, (app) => escalateToTieBreaker(app));
    set({ tieBreakerOpen: true, clockRunning: false });
  },

  tieBreak: (outcome, by, note) => {
    update(set, get, (app) => tieBreakerDecision(app, outcome, by, note));
    set({ tieBreakerOpen: false, clockRunning: false });
  },

  failScore: () => {
    update(set, get, (app) => failOnScore(app));
    set({ clockRunning: false });
  },

  finalise: () => {
    update(set, get, (app) => finaliseFile(app));
    set({ clockRunning: false });
  },

  patchRecord: (appId, recordId, state, value) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === appId ? setRecordState(a, recordId, { state, value, fetched_at: new Date().toISOString() }) : a,
      ),
    })),

  fetchRecord: (recordId) => {
    const appId = get().selectedId;
    const app = get().applications.find((a) => a.id === appId);
    const rec = app?.records.find((r) => r.id === recordId);
    if (!app || !rec || rec.state === "fetching") return;

    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === appId ? setRecordState(a, recordId, { state: "fetching" }) : a,
      ),
    }));

    const answer = RECORD_ANSWERS[recordId] ?? { state: "unavailable" as DataRecordState, value: "No record returned." };
    window.setTimeout(() => {
      get().patchRecord(appId, recordId, answer.state, answer.value);
    }, rec.latency_ms);
  },

  fetchAllRecords: () => {
    const app = get().applications.find((a) => a.id === get().selectedId);
    if (!app) return;
    for (const r of app.records) {
      if (r.state === "idle" || r.state === "unavailable") get().fetchRecord(r.id);
    }
  },

  resetFile: () =>
    set((s) => {
      const fresh = seedApplications().find((a) => a.id === s.selectedId);
      if (!fresh) return s;
      return {
        applications: s.applications.map((a) => (a.id === s.selectedId ? fresh : a)),
        clockRunning: false,
        tieBreakerOpen: false,
        packetOpen: false,
        tab: "thread",
      };
    }),
}));

function update(
  set: (fn: (s: MatrixState) => Partial<MatrixState>) => void,
  get: () => MatrixState,
  fn: (app: ApplicationFile) => ApplicationFile,
) {
  const id = get().selectedId;
  set((s) => ({
    applications: s.applications.map((a) => (a.id === id ? fn(a) : a)),
  }));
}

/** First time a file goes into conflict, the cross-departmental thread opens itself. */
function openThreadOnConflict(before: ApplicationFile, after: ApplicationFile): ApplicationFile {
  const wasConflict = derive(before).conflict;
  const isConflict = derive(after).conflict;
  if (!isConflict || wasConflict) return after;

  const d = derive(after);
  const withNote = postMessage(after, {
    author: "Matrix 2.0",
    author_short: "SYSTEM",
    role: "system",
    dept_id: null,
    body: NOTE_ON_CONFLICT,
  });

  const rejecter = d.rejected[0];
  const approver = d.approved[0];
  let thread = withNote;
  if (rejecter?.remarks) {
    thread = postMessage(thread, {
      author: rejecter.officer_name,
      author_short: rejecter.dept_short,
      role: "department",
      dept_id: rejecter.dept_id,
      body: rejecter.remarks,
    });
  }
  if (approver?.remarks) {
    thread = postMessage(thread, {
      author: approver.officer_name,
      author_short: approver.dept_short,
      role: "department",
      dept_id: approver.dept_id,
      body: approver.remarks,
    });
  }
  return thread;
}

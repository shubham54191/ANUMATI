"use client";
import { create } from "zustand";
import type { ApplicationFile, DataRecordState } from "@/types/matrix";
import { seedApplications } from "@/lib/matrix/applications";
import type { DecisionInput } from "@/lib/matrix/engine";
import {
  advanceDay,
  answerQuery as answerQueryOn,
  committeeDecide as committeeDecideOn,
  decide as decideOn,
  derive,
  dispatch as dispatchFile,
  escalateToTieBreaker,
  failOnScore,
  finalise as finaliseFile,
  isOpen,
  postMessage,
  raiseQuery as raiseQueryOn,
  reEvaluate as reEvaluateDept,
  sendForRevision as sendForRevisionOn,
  setRecordState,
  tieBreakerDecision,
  verifyParameters as verifyParametersOn,
} from "@/lib/matrix/engine";
import { api, ApiError, isLive } from "@/lib/api/client";

export type ContextTab = "thread" | "data" | "scope" | "sla" | "visits" | "redress" | "audit";

/** The server's view of one file: the file plus everything it derived. */
export interface FileView {
  file: ApplicationFile;
  version: number;
  clocks: Record<string, { sla_left: number | null; deemed_left: number | null; paused_days: number; query_open: boolean }>;
  linked_roadmap: string | null;
  demo_controls: boolean;
}

/** Every write the console can make — the same union the API accepts. */
export type MatrixCommand =
  | { type: "dispatch" }
  | { type: "decide"; dept_id: string; state: "approved" | "rejected"; remarks?: string; score?: number }
  | { type: "demo_clash" }
  | { type: "re_evaluate"; dept_id: string; note: string }
  | { type: "verify_parameters"; dept_id: string }
  | { type: "post_message"; body: string; dept_id?: string | null }
  | { type: "raise_query"; dept_id: string; body: string }
  | { type: "answer_query"; dept_id: string; body: string }
  | { type: "send_for_revision"; reply_days?: number }
  | { type: "resubmit"; note: string }
  | { type: "escalate" }
  | { type: "tie_break"; outcome: "overrule" | "sustain"; note: string }
  | { type: "committee_decide"; dept_id: string; outcome: "approved" | "rejected"; note: string }
  | { type: "fail_score" }
  | { type: "finalise" }
  | { type: "fetch_records" }
  | { type: "advance_days"; days: number };

interface MatrixState {
  /** demo: seeded files, simulated in this browser. live: the server's files. */
  mode: "demo" | "live";
  applications: ApplicationFile[];
  selectedId: string;
  tab: ContextTab;
  /** The clarification thread is composed from the console as one department. */
  speakingAs: string | null;
  clockRunning: boolean;
  tieBreakerOpen: boolean;
  packetOpen: boolean;

  /** Live mode only. */
  loading: boolean;
  error: string | null;
  busy: boolean;
  /** Whether the server allows the demo controls (advance clock, scripted clash). */
  demoControls: boolean;
  views: Record<string, FileView>;

  load: () => Promise<void>;
  refresh: (id: string) => Promise<void>;
  send: (cmd: MatrixCommand, id?: string) => Promise<boolean>;
  clearError: () => void;

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
  raiseQuery: (deptId: string, body: string) => void;
  answerQuery: (deptId: string, body: string) => void;
  committeeDecide: (deptId: string, outcome: "approved" | "rejected", note: string) => void;

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
 * Deterministic answers from the shared data matrix, for demo mode. A real
 * deployment calls the ministry of record through the API's adapters; the
 * shape of what comes back is the same either way, including the case that
 * matters most — a record that contradicts the file.
 */
const RECORD_ANSWERS: Record<string, { state: DataRecordState; value: string }> = {
  "DR-PAN-GST": { state: "verified", value: "GSTIN active · returns filed to Aug 2026 · no demand outstanding" },
  "DR-LAND": { state: "verified", value: "Parcel PN-CHK-114/2A · MIDC lease registered · no encumbrance" },
  "DR-PROMOTER": { state: "verified", value: "2 promoters · no adverse record · no disqualification under s. 164" },
  "DR-EPFO": { state: "verified", value: "Establishment code active · contributions current · no default" },
  "DR-WATER-DRAW": { state: "mismatch", value: "MIDC water application: 210 KLD. MPCB consent form: ETP sized for 145 KLD." },
  "DR-EGRESS": { state: "mismatch", value: "DISH plan set: 2 exits, staircase 1.2 m. Fire Service plan set: 3 exits, staircase 1.5 m." },
  "DR-TRANSFORMER": { state: "mismatch", value: "MSEDCL load application: 1250 kVA transformer. CEIG single-line diagram: 1600 kVA." },
};

const NOTE_ON_CONFLICT =
  "Conflict Resolution Protocol opened this thread. Both departments can settle the objection here; a withdrawn rejection re-enters the pipeline as processing.";

const LIVE = isLive();

export const useMatrixStore = create<MatrixState>((set, get) => {
  /** In live mode, every action is one command to the server. */
  const live = (cmd: MatrixCommand) => {
    void get().send(cmd);
  };

  return {
    mode: LIVE ? "live" : "demo",
    applications: LIVE ? [] : seedApplications(),
    selectedId: LIVE ? "" : seedApplications()[0].id,
    tab: "thread",
    speakingAs: null,
    clockRunning: false,
    tieBreakerOpen: false,
    packetOpen: false,

    loading: LIVE,
    error: null,
    busy: false,
    demoControls: !LIVE,
    views: {},

    load: async () => {
      if (!LIVE) return;
      set({ loading: true, error: null });
      try {
        const list = await api<{ data: { id: string }[] }>("/v1/matrix/files");
        const views = await Promise.all(list.data.map((f) => api<FileView>(`/v1/matrix/files/${f.id}`)));
        const byId: Record<string, FileView> = {};
        for (const v of views) byId[v.file.id] = v;
        const want = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("file") : null;
        const current = get().selectedId;
        const selected =
          want && byId[want] ? want : current && byId[current] ? current : (views[0]?.file.id ?? "");
        set({
          applications: views.map((v) => v.file),
          views: byId,
          selectedId: selected,
          demoControls: views.some((v) => v.demo_controls),
          loading: false,
        });
      } catch (e) {
        set({ loading: false, error: e instanceof ApiError ? e.message : "Could not load the files." });
      }
    },

    refresh: async (id) => {
      if (!LIVE) return;
      try {
        const v = await api<FileView>(`/v1/matrix/files/${id}`);
        set((s) => {
          const exists = s.applications.some((a) => a.id === id);
          return {
            applications: exists ? s.applications.map((a) => (a.id === id ? v.file : a)) : [v.file, ...s.applications],
            views: { ...s.views, [id]: v },
            selectedId: s.selectedId || id,
          };
        });
      } catch {
        /* not ours to see, or the next event will catch up */
      }
    },

    send: async (cmd, id) => {
      const fileId = id ?? get().selectedId;
      if (!fileId) return false;
      set({ busy: true, error: null });
      try {
        const v = await api<FileView>(`/v1/matrix/files/${fileId}/commands`, {
          method: "POST",
          body: cmd as unknown as Record<string, unknown>,
        });
        set((s) => ({
          applications: s.applications.map((a) => (a.id === fileId ? v.file : a)),
          views: { ...s.views, [fileId]: v },
          busy: false,
        }));
        return true;
      } catch (e) {
        set({ busy: false, clockRunning: false, error: e instanceof ApiError ? e.message : "The server did not accept that." });
        return false;
      }
    },

    clearError: () => set({ error: null }),

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

    dispatchAll: () => (LIVE ? live({ type: "dispatch" }) : update(set, get, (app) => dispatchFile(app))),

    decide: (deptId, state, opts) =>
      LIVE
        ? live({ type: "decide", dept_id: deptId, state, remarks: opts?.remarks, score: opts?.score })
        : update(set, get, (app) =>
            openThreadOnConflict(app, decideOn(app, [{ dept_id: deptId, state, score: opts?.score, remarks: opts?.remarks }])),
          ),

    /**
     * The case the protocol exists for: two departments committing opposite
     * decisions on the same file at the same instant.
     */
    triggerClash: () => {
      if (LIVE) return live({ type: "demo_clash" });
      update(set, get, (app) => {
        // Only desks that are still open get a decision — replaying the clash
        // after one side has withdrawn should not silently rewrite the other.
        const inputs: DecisionInput[] = [];
        const approver = app.reviews.find((r) => r.dept_id === app.demo.approver_dept);
        const rejecter = app.reviews.find((r) => r.dept_id === app.demo.rejecter_dept);
        if (approver && isOpen(approver)) {
          inputs.push({ dept_id: approver.dept_id, state: "approved", remarks: app.demo.approver_note, score: app.demo.approver_score });
        }
        if (rejecter && isOpen(rejecter)) {
          inputs.push({ dept_id: rejecter.dept_id, state: "rejected", remarks: app.demo.rejection_reason, score: app.demo.rejecter_score });
        }
        return openThreadOnConflict(app, decideOn(app, inputs));
      });
    },

    reEvaluate: (deptId, note) => {
      if (LIVE) live({ type: "re_evaluate", dept_id: deptId, note });
      else update(set, get, (app) => reEvaluateDept(app, deptId, note));
      set({ tieBreakerOpen: false });
    },

    verifyParameters: (deptId) =>
      LIVE ? live({ type: "verify_parameters", dept_id: deptId }) : update(set, get, (app) => verifyParametersOn(app, deptId)),

    post: (body, deptId) => {
      if (LIVE) return live({ type: "post_message", body, dept_id: deptId });
      update(set, get, (app) => {
        const dept = app.reviews.find((r) => r.dept_id === deptId);
        return postMessage(app, {
          author: dept ? `${dept.officer_name}` : "Single-window officer",
          author_short: dept ? dept.dept_short : "SINGLE WINDOW",
          role: dept ? "department" : "officer",
          dept_id: dept?.dept_id ?? null,
          body,
        });
      });
    },

    raiseQuery: (deptId, body) =>
      LIVE ? live({ type: "raise_query", dept_id: deptId, body }) : update(set, get, (app) => raiseQueryOn(app, deptId, body)),

    answerQuery: (deptId, body) =>
      LIVE ? live({ type: "answer_query", dept_id: deptId, body }) : update(set, get, (app) => answerQueryOn(app, deptId, body)),

    committeeDecide: (deptId, outcome, note) =>
      LIVE
        ? live({ type: "committee_decide", dept_id: deptId, outcome, note })
        : update(set, get, (app) => committeeDecideOn(app, deptId, outcome, "Empowered Committee", note)),

    toggleClock: () => set((s) => ({ clockRunning: !s.clockRunning })),
    advance: (days = 1) =>
      LIVE ? live({ type: "advance_days", days }) : update(set, get, (app) => advanceDay(app, days)),

    sendForRevision: () => {
      if (LIVE) live({ type: "send_for_revision" });
      else update(set, get, (app) => sendForRevisionOn(app));
      set({ packetOpen: true, clockRunning: false });
    },

    escalate: () => {
      if (LIVE) live({ type: "escalate" });
      else update(set, get, (app) => escalateToTieBreaker(app));
      set({ tieBreakerOpen: true, clockRunning: false });
    },

    tieBreak: (outcome, by, note) => {
      if (LIVE) live({ type: "tie_break", outcome, note });
      else update(set, get, (app) => tieBreakerDecision(app, outcome, by, note));
      set({ tieBreakerOpen: false, clockRunning: false });
    },

    failScore: () => {
      if (LIVE) live({ type: "fail_score" });
      else update(set, get, (app) => failOnScore(app));
      set({ clockRunning: false });
    },

    finalise: () => {
      if (LIVE) live({ type: "finalise" });
      else update(set, get, (app) => finaliseFile(app));
      set({ clockRunning: false });
    },

    patchRecord: (appId, recordId, state, value) =>
      set((s) => ({
        applications: s.applications.map((a) =>
          a.id === appId ? setRecordState(a, recordId, { state, value, fetched_at: new Date().toISOString() }) : a,
        ),
      })),

    fetchRecord: (recordId) => {
      if (LIVE) return live({ type: "fetch_records" });
      const appId = get().selectedId;
      const app = get().applications.find((a) => a.id === appId);
      const rec = app?.records.find((r) => r.id === recordId);
      if (!app || !rec || rec.state === "fetching") return;

      set((s) => ({
        applications: s.applications.map((a) => (a.id === appId ? setRecordState(a, recordId, { state: "fetching" }) : a)),
      }));

      const answer = RECORD_ANSWERS[recordId] ?? { state: "unavailable" as DataRecordState, value: "No record returned." };
      window.setTimeout(() => {
        get().patchRecord(appId, recordId, answer.state, answer.value);
      }, rec.latency_ms);
    },

    fetchAllRecords: () => {
      if (LIVE) return live({ type: "fetch_records" });
      const app = get().applications.find((a) => a.id === get().selectedId);
      if (!app) return;
      for (const r of app.records) {
        if (r.state === "idle" || r.state === "unavailable") get().fetchRecord(r.id);
      }
    },

    resetFile: () => {
      if (LIVE) {
        set({ error: "A live file cannot be reset — its history is in the ledger." });
        return;
      }
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
      });
    },
  };
});

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

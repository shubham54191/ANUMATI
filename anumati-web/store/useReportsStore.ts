"use client";
import { create } from "zustand";
import type { FieldReport, ReportKind } from "@/types/report";
import { SEEDED_REPORTS } from "@/lib/data/fieldReports";

/**
 * The closed loop, client side.
 *
 * A report filed here lands in the same pool the second clock is computed
 * from, so filing one visibly moves the number it feeds. That is the whole
 * argument for collecting them: an applicant who reports a delay is not
 * filling in a suggestion box, they are editing the district's planning
 * figure — under review, and with their row readable underneath it.
 *
 * Filed rows stay in localStorage and are kept apart from seeded ones, because
 * a median that mixes shipped demo data with real evidence and says nothing
 * about the difference is worse than no median at all.
 */

const KEY = "anumati.reports";

interface ReportsState {
  filed: FieldReport[];
  hydrated: boolean;
  hydrate: () => void;
  file: (input: {
    approval_id: string;
    kind: ReportKind;
    observed_days: number | null;
    detail: string;
    district?: string;
  }) => void;
  clearFiled: () => void;
  /** Seeded plus filed — what every aggregate reads. */
  all: () => FieldReport[];
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  filed: [],
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      set({ filed: raw ? (JSON.parse(raw) as FieldReport[]) : [], hydrated: true });
    } catch {
      set({ filed: [], hydrated: true });
    }
  },

  file: (input) => {
    const report: FieldReport = {
      id: `FR-U${Date.now().toString(36).slice(-5).toUpperCase()}`,
      approval_id: input.approval_id,
      kind: input.kind,
      observed_days: input.observed_days,
      detail: input.detail.trim() || "No detail recorded.",
      reported_on: new Date().toISOString().slice(0, 10),
      district: input.district ?? "Pune",
      origin: "filed",
      // A filed report never publishes itself into the rule base. It counts
      // towards the observed median and waits for a verifier.
      status: "new",
    };
    const filed = [report, ...get().filed];
    set({ filed });
    persist(filed);
  },

  clearFiled: () => {
    set({ filed: [] });
    persist([]);
  },

  all: () => [...get().filed, ...SEEDED_REPORTS],
}));

function persist(filed: FieldReport[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(filed));
  } catch {
    /* private mode — the report just does not survive a reload */
  }
}

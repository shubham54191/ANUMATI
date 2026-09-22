"use client";
import { create } from "zustand";
import type { Grievance } from "@/types/compliance";

/**
 * The one thing an applicant can do when nothing else works.
 *
 * The MAITRI Act gives the Empowered Committee power to call for the reasons
 * behind a delay or a rejection and to inquire into grievances raised by
 * applicants (s. 8). That is a real remedy, and it is one button — but the
 * button has to leave the department, or it is a suggestion box.
 *
 * A grievance filed here appears in the officer console's queue immediately.
 * It does not decide anything: the Committee still disposes of the underlying
 * application under the relevant law (s. 5(3)).
 */

const KEY = "anumati.grievances";

const ROUTE = "Empowered Committee, MAITRI Act 2023";
const AUTHORITY = "MAITRI Act, 2023 — s. 8 (power to inquire into delay and grievance)";

const SEEDED: Grievance[] = [
  {
    id: "GR-001",
    approval_id: "A13",
    approval_name: "Fire NOC — provisional",
    department_short: "MFS",
    applicant: "Deccan Cold Storage LLP",
    raised_on: "2026-09-12",
    days_pending: 34,
    reason:
      "Provisional NOC pending 34 days against a 21-day limit. Two visits made to the office; no query has been issued in writing.",
    status: "acknowledged",
    route: ROUTE,
    authority: AUTHORITY,
    origin: "seeded",
  },
];

interface GrievanceState {
  filed: Grievance[];
  hydrated: boolean;
  hydrate: () => void;
  raise: (input: {
    approval_id: string;
    approval_name: string;
    department_short: string;
    applicant: string;
    days_pending: number;
    reason: string;
  }) => void;
  setStatus: (id: string, status: Grievance["status"]) => void;
  all: () => Grievance[];
}

export const useGrievanceStore = create<GrievanceState>((set, get) => ({
  filed: [],
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      set({ filed: raw ? (JSON.parse(raw) as Grievance[]) : [], hydrated: true });
    } catch {
      set({ filed: [], hydrated: true });
    }
  },

  raise: (input) => {
    const grievance: Grievance = {
      id: `GR-U${Date.now().toString(36).slice(-5).toUpperCase()}`,
      ...input,
      raised_on: new Date().toISOString().slice(0, 10),
      status: "open",
      route: ROUTE,
      authority: AUTHORITY,
      origin: "filed",
    };
    const filed = [grievance, ...get().filed];
    set({ filed });
    persist(filed);
  },

  setStatus: (id, status) => {
    const filed = get().filed.map((g) => (g.id === id ? { ...g, status } : g));
    set({ filed });
    persist(filed);
  },

  all: () => [...get().filed, ...SEEDED],
}));

export const SEEDED_GRIEVANCES = SEEDED;

function persist(filed: Grievance[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(filed));
  } catch {
    /* private mode — the grievance just does not survive a reload */
  }
}

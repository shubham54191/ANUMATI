"use client";
import { create } from "zustand";
import { api, ApiError, isLive } from "@/lib/api/client";

/**
 * Sign-in, in two modes.
 *
 * Demo mode (no API configured): two local accounts decide which product a
 * person sees. Nothing is protected, and the screens say so.
 *
 * Live mode: the ANUMATI server checks the password, issues a short-lived
 * token, and enforces every role and every department boundary itself. The
 * browser only decides what to draw.
 */

export type Role = "officer" | "applicant" | "committee" | "reviewer" | "admin";

export interface Session {
  role: Role;
  username: string;
  name: string;
  designation: string;
  office: string;
  /** Demo mode only: the facilitation officer also chairs the tie-breaker. */
  admin: boolean;
  /** Live mode: the department whose desks this officer may act on. */
  department_id?: string | null;
  /** Live mode: the bearer token the API issued. */
  token?: string;
  /** Live mode: whether this is a seeded demo account. */
  is_demo?: boolean;
  live?: boolean;
}

const OFFICER_SESSION: Session = {
  role: "officer",
  username: "OFFICER",
  name: "Demo Officer",
  designation: "Single-Window Facilitation Officer",
  office: "District Industries Centre, Pune",
  admin: true,
  department_id: "single-window",
};

const APPLICANT_SESSION: Session = {
  role: "applicant",
  username: "APPLICANT",
  name: "Sahyadri Agro Foods Pvt Ltd",
  designation: "Applicant",
  office: "MIDC Chakan, Pune",
  admin: false,
};

const COMMITTEE_SESSION: Session = {
  role: "committee",
  username: "COMMITTEE",
  name: "Empowered Committee",
  designation: "Development Commissioner (Industries), chair",
  office: "MAITRI Act, 2023 — s. 6",
  admin: false,
};

const REVIEWER_SESSION: Session = {
  role: "reviewer",
  username: "REVIEWER",
  name: "Rule Reviewer",
  designation: "Rule review desk",
  office: "Single-window facilitation cell",
  admin: false,
};

/**
 * What one tap on each entry card does.
 *
 * Nobody arriving at this build is told a password, so nobody is asked for
 * one. In live mode the server still issues the token, and the seeded account
 * it is issued for is named here rather than printed on the screen — the
 * credential never leaves the code and never reaches the reader.
 */
export type EntryRole = "applicant" | "officer" | "committee" | "reviewer";

const DEMO_LOGIN: Record<EntryRole, { username: string; password: string; local: Session }> = {
  applicant: { username: "applicant", password: "demo", local: APPLICANT_SESSION },
  officer: { username: "officer", password: "admin", local: OFFICER_SESSION },
  committee: { username: "committee", password: "demo", local: COMMITTEE_SESSION },
  reviewer: { username: "reviewer", password: "demo", local: REVIEWER_SESSION },
};

const KEY = "anumati.session";

type SignInResult = { ok: true; session: Session } | { ok: false; message: string };

interface AuthState {
  session: Session | null;
  /** False until localStorage has been read — guards against a flash of the wrong view. */
  hydrated: boolean;
  hydrate: () => void;
  /** remember=false keeps the session for this tab only (sessionStorage). */
  signIn: (username: string, password: string, remember?: boolean) => Promise<SignInResult>;
  signInAsApplicant: () => Promise<SignInResult>;
  signInAs: (role: EntryRole) => Promise<SignInResult>;
  signOut: () => void;
}

interface LoginResponse {
  token: string;
  principal: {
    id: string;
    username: string;
    role: Role;
    name: string;
    designation: string;
    office: string;
    department_id: string | null;
    is_demo: boolean;
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);
      const session = raw ? (JSON.parse(raw) as Session) : null;
      // A session from the other mode is not a session in this one.
      const valid = session && Boolean(session.live) === isLive() ? session : null;
      set({ session: valid, hydrated: true });
    } catch {
      set({ session: null, hydrated: true });
    }
  },

  signIn: async (username, password, remember = true) => {
    const u = username.trim().toLowerCase();
    const p = password.trim();
    if (u.length === 0 || p.length === 0) {
      return { ok: false, message: "Enter both a user id and a password." };
    }

    if (isLive()) {
      try {
        const res = await api<LoginResponse>("/v1/auth/login", {
          method: "POST",
          body: { username: u, password: p },
          token: null,
        });
        const pr = res.principal;
        const session: Session = {
          role: pr.role,
          username: pr.username,
          name: pr.name,
          designation: pr.designation,
          office: pr.office,
          admin: pr.role === "admin" || pr.department_id === "single-window",
          department_id: pr.department_id,
          token: res.token,
          is_demo: pr.is_demo,
          live: true,
        };
        persist(session, remember);
        set({ session, hydrated: true });
        return { ok: true, session };
      } catch (e) {
        return {
          ok: false,
          message: e instanceof ApiError ? e.message : "Sign-in failed. Try again.",
        };
      }
    }

    const lp = p.toLowerCase();
    if (u === "officer" && lp === "admin") {
      persist(OFFICER_SESSION, remember);
      set({ session: OFFICER_SESSION, hydrated: true });
      return { ok: true, session: OFFICER_SESSION };
    }
    if (u === "applicant" && (lp === "demo" || lp === "applicant")) {
      persist(APPLICANT_SESSION, remember);
      set({ session: APPLICANT_SESSION, hydrated: true });
      return { ok: true, session: APPLICANT_SESSION };
    }
    return { ok: false, message: "That user id and password do not match a demo account." };
  },

  signInAsApplicant: async () => get().signInAs("applicant"),

  signInAs: async (role) => {
    const entry = DEMO_LOGIN[role];
    if (isLive()) return get().signIn(entry.username, entry.password);
    persist(entry.local);
    set({ session: entry.local, hydrated: true });
    return { ok: true, session: entry.local };
  },

  signOut: () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(KEY);
        window.sessionStorage.removeItem(KEY);
      } catch {
        /* storage blocked */
      }
    }
    set({ session: null, hydrated: true });
  },
}));

// An expired token anywhere signs the user out, rather than failing quietly.
if (typeof window !== "undefined") {
  window.addEventListener("anumati:unauthorized", () => useAuthStore.getState().signOut());
}

function persist(session: Session, remember = true) {
  if (typeof window === "undefined") return;
  try {
    const keep = remember ? window.localStorage : window.sessionStorage;
    const drop = remember ? window.sessionStorage : window.localStorage;
    drop.removeItem(KEY);
    keep.setItem(KEY, JSON.stringify(session));
  } catch {
    /* private mode — the session just does not survive a reload */
  }
}

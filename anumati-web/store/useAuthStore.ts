"use client";
import { create } from "zustand";

/**
 * Demo-grade sign-in. There is no server here — the roadmap engine and the
 * matrix console both run in the browser — so this decides which product a
 * person sees, not what they are allowed to read. Anything that actually
 * needed protecting would be checked again on the server.
 */

export type Role = "officer" | "applicant";

export interface Session {
  role: Role;
  username: string;
  name: string;
  designation: string;
  office: string;
  /** Officer sign-in with the admin credential also chairs the tie-breaker. */
  admin: boolean;
}

const OFFICER_SESSION: Session = {
  role: "officer",
  username: "OFFICER",
  name: "R. Kulkarni",
  designation: "Single-Window Facilitation Officer",
  office: "District Industries Centre, Pune",
  admin: true,
};

const APPLICANT_SESSION: Session = {
  role: "applicant",
  username: "APPLICANT",
  name: "Sahyadri Agro Foods Pvt Ltd",
  designation: "Applicant",
  office: "MIDC Chakan, Pune",
  admin: false,
};

const KEY = "anumati.session";

interface AuthState {
  session: Session | null;
  /** False until localStorage has been read — guards against a flash of the wrong view. */
  hydrated: boolean;
  hydrate: () => void;
  signIn: (username: string, password: string) => { ok: true } | { ok: false; message: string };
  signInAsApplicant: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      set({ session: raw ? (JSON.parse(raw) as Session) : null, hydrated: true });
    } catch {
      set({ session: null, hydrated: true });
    }
  },

  signIn: (username, password) => {
    const u = username.trim().toLowerCase();
    const p = password.trim().toLowerCase();

    if (u === "officer" && p === "admin") {
      persist(OFFICER_SESSION);
      set({ session: OFFICER_SESSION, hydrated: true });
      return { ok: true };
    }
    if (u === "applicant" && (p === "demo" || p === "applicant")) {
      persist(APPLICANT_SESSION);
      set({ session: APPLICANT_SESSION, hydrated: true });
      return { ok: true };
    }
    return {
      ok: false,
      message:
        u.length === 0 || p.length === 0
          ? "Enter both a user id and a password."
          : "That user id and password do not match a demo account.",
    };
  },

  signInAsApplicant: () => {
    persist(APPLICANT_SESSION);
    set({ session: APPLICANT_SESSION, hydrated: true });
  },

  signOut: () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
    set({ session: null, hydrated: true });
  },
}));

function persist(session: Session) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* private mode — the session just does not survive a reload */
  }
}

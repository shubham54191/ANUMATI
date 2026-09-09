"use client";
import { useEffect } from "react";
import { useRoadmapStore } from "@/store/useRoadmapStore";

export function useKeyboardShortcuts() {
  const setViewMode = useRoadmapStore((s) => s.setViewMode);
  const select = useRoadmapStore((s) => s.select);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "a" || e.key === "A") setViewMode("applicant");
      if (e.key === "d" || e.key === "D") setViewMode("department");
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setViewMode, select]);
}

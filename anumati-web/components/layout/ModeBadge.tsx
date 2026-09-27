"use client";
import { useEffect, useRef, useState } from "react";
import { api, isLive, type ServerMeta } from "@/lib/api/client";
import { cn } from "@/lib/utils";

let cached: Promise<ServerMeta | null> | null = null;

/** What the server says it is. Fetched once per page load. */
export function useServerMeta(): ServerMeta | null {
  const [meta, setMeta] = useState<ServerMeta | null>(null);
  useEffect(() => {
    if (!isLive()) return;
    cached ??= api<ServerMeta>("/v1/meta", { token: null }).catch(() => null);
    let on = true;
    void cached.then((m) => on && setMeta(m));
    return () => {
      on = false;
    };
  }, []);
  return meta;
}

/**
 * Says, on every screen, which ANUMATI this is: the offline demo, a live
 * server running on recorded government answers, or a live server wired to
 * the real systems. A walkthrough must never pass for a deployment.
 *
 * The badge is a button: it opens a short card that spells out what is real
 * — where data lives, whether it is saved, where government answers come
 * from, and who signs.
 */
export function ModeBadge({ className }: { className?: string }) {
  const meta = useServerMeta();
  const [down, setDown] = useState(false);
  const [open, setOpen] = useState(false);
  // The bars clip overflow, so the card is positioned against the viewport.
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const wrap = useRef<HTMLSpanElement>(null);
  const toggle = () => {
    const r = wrap.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 8, right: Math.max(12, window.innerWidth - r.right) });
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!isLive()) return;
    const t = window.setTimeout(() => setDown(meta === null), 4000);
    return () => window.clearTimeout(t);
  }, [meta]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  let label: string;
  let tone: string;
  let dot: string;
  let rows: [string, string][];
  if (!isLive()) {
    label = "DEMO · OFFLINE";
    tone = "border-db-line bg-db-bg text-db-muted";
    dot = "bg-db-faint";
    rows = [
      ["Data", "Simulated in this browser on the seeded rule base"],
      ["Saved", "Nothing reaches a server; a reload resets the files"],
      ["Government systems", "Recorded answers"],
      ["Signing", "None — decisions are not signed"],
    ];
  } else if (!meta) {
    label = down ? "SERVER UNREACHABLE" : "CONNECTING…";
    tone = "border-db-red-line bg-db-red-tint text-db-red";
    dot = "bg-db-red";
    rows = [
      ["Server", down ? "No answer from the ANUMATI server" : "Waiting for the server to answer"],
      ["What to do", down ? "Check the server is running, then reload" : "Give it a few seconds"],
    ];
  } else {
    const recorded = meta.adapter_mode === "fixture";
    const caution = meta.demo_mode || recorded;
    label = `LIVE · ${meta.rules_version}${meta.demo_mode ? " · DEMO" : ""}${recorded ? " · RECORDED" : ""}`;
    tone = caution ? "border-db-amber-line bg-db-amber-tint text-db-amber" : "border-db-green/40 bg-db-green-tint text-db-green";
    dot = caution ? "bg-db-amber" : "bg-db-green";
    rows = [
      ["Data", meta.demo_mode ? "Real server, seeded with demo accounts and files" : "Real server"],
      ["Saved", "Yes — in the database, every decision on a hash-chained ledger"],
      ["Government systems", recorded ? "Recorded answers (not live API Setu / MAITRI)" : "Live"],
      ["Signing", meta.dsc_mode === "demo" ? "Demo key — not a DSC" : "Officer's own DSC, verified by the server"],
      ["Rules · engine", `${meta.rules_version} · ${meta.engine_version}`],
    ];
  }

  return (
    <span ref={wrap} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="What is real on this screen"
        className={cn(
          "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[10.5px] font-semibold tracking-[0.06em] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          tone,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {label}
      </button>
      {open && pos ? (
        <span
          role="dialog"
          aria-label="What is real on this screen"
          style={{ top: pos.top, right: pos.right }}
          className="db-dialog fixed z-50 w-[300px] max-w-[calc(100vw-24px)] rounded-xl border border-db-line bg-surface p-3.5 text-left shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
        >
          <span className="block text-[11px] font-bold tracking-[0.06em] text-db-muted">WHAT IS REAL HERE</span>
          <span className="mt-2 grid grid-cols-[112px_1fr] gap-x-3 gap-y-1.5">
            {rows.map(([k, v]) => (
              <span key={k} className="contents">
                <span className="text-[11.5px] text-db-muted">{k}</span>
                <span className="text-[11.5px] leading-snug text-db-ink">{v}</span>
              </span>
            ))}
          </span>
        </span>
      ) : null}
    </span>
  );
}

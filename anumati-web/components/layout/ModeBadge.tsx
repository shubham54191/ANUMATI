"use client";
import { useEffect, useState } from "react";
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
 */
export function ModeBadge({ className }: { className?: string }) {
  const meta = useServerMeta();
  const [down, setDown] = useState(false);
  useEffect(() => {
    if (!isLive()) return;
    const t = window.setTimeout(() => setDown(meta === null), 4000);
    return () => window.clearTimeout(t);
  }, [meta]);

  if (!isLive()) {
    return (
      <span
        className={cn("inline-flex h-6 items-center gap-1.5 rounded-full border border-db-line bg-db-bg px-2.5 text-[10.5px] font-semibold tracking-[0.06em] text-db-muted", className)}
        title="No server: everything runs in this browser on the seeded rule base. Nothing is stored."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-db-faint" />
        DEMO · OFFLINE
      </span>
    );
  }
  if (!meta) {
    return (
      <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full border border-db-red-line bg-db-red-tint px-2.5 text-[10.5px] font-semibold tracking-[0.06em] text-db-red", className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-db-red" />
        {down ? "SERVER UNREACHABLE" : "CONNECTING…"}
      </span>
    );
  }
  const recorded = meta.adapter_mode === "fixture";
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[10.5px] font-semibold tracking-[0.06em]",
        meta.demo_mode || recorded ? "border-db-amber-line bg-db-amber-tint text-db-amber" : "border-db-green/40 bg-db-green-tint text-db-green",
        className,
      )}
      title={`${meta.demo_mode ? "Demo data and demo accounts. " : ""}Rules ${meta.rules_version} · engine ${meta.engine_version} · government systems: ${recorded ? "recorded answers" : "live"} · signing: ${meta.dsc_mode === "demo" ? "demo key, not a DSC" : "officer DSC"}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.demo_mode || recorded ? "bg-db-amber" : "bg-db-green")} />
      LIVE · {meta.rules_version}
      {meta.demo_mode ? " · DEMO" : ""}
      {recorded ? " · RECORDED" : ""}
    </span>
  );
}

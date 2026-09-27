"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import type { ApplicationSummary } from "@/lib/api/applications";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  draft: "text-db-muted",
  submitted: "text-db-blue",
  in_clearance: "text-db-blue",
  returned: "text-db-amber",
  cleared: "text-db-green",
  completed: "text-db-green",
};

/** Everything this applicant has started or filed, newest first. */
export function ApplicationList() {
  const [rows, setRows] = useState<ApplicationSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: ApplicationSummary[] }>("/v1/applications")
      .then((r) => setRows(r.data))
      .catch((e) => {
        setError(e instanceof ApiError ? e.message : "Could not load your applications.");
        setRows([]);
      });
  }, []);

  return (
    <AppShell active="applications">
      <main className="flex-1 overflow-y-auto bg-db-bg">
        <div className="mx-auto w-full max-w-[960px] px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-db-ink">My applications</h1>
              <p className="mt-1 text-[13px] text-db-muted">Drafts you are preparing and files the departments are deciding.</p>
            </div>
            <Link
              href="/roadmap/new"
              className="flex h-9 items-center gap-2 rounded-lg bg-db-blue px-3.5 text-[12.5px] font-semibold text-white no-underline hover:brightness-95"
            >
              New roadmap <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {error ? <p className="mt-4 text-[12.5px] text-db-red">{error}</p> : null}

          <div className="mt-6 overflow-hidden rounded-xl border border-db-line bg-surface">
            {rows === null ? (
              <div className="flex flex-col divide-y divide-db-line">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex h-[64px] items-center gap-4 px-4">
                    <span className="h-3 w-24 animate-pulse rounded bg-db-bg" />
                    <span className="h-3 flex-1 animate-pulse rounded bg-db-bg" />
                  </div>
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <FolderOpen className="h-7 w-7 text-db-faint" strokeWidth={1.5} />
                <p className="text-[14px] font-semibold text-db-ink">No applications yet</p>
                <p className="max-w-[380px] text-[12.5px] text-db-muted">
                  Build a roadmap, then choose “Start an application” under it. Nothing is filed until the pre-check passes.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-db-line">
                {rows.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/applications/${encodeURIComponent(r.id)}`}
                      className="flex items-center gap-4 px-4 py-3.5 no-underline transition-colors hover:bg-db-bg"
                    >
                      <span className="w-[120px] flex-none font-mono text-[12px] font-semibold text-db-ink">{r.id}</span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px] text-db-ink">{r.project}</span>
                      <span className={cn("text-[11px] font-semibold uppercase tracking-[0.06em]", TONE[r.status] ?? "text-db-muted")}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                      <span className="hidden w-[96px] text-right text-[11.5px] text-db-faint sm:block">
                        {new Date(r.filed_at ?? r.created_at).toLocaleDateString("en-IN")}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-db-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}

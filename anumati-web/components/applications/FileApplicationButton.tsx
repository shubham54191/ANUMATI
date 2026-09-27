"use client";
import { useState } from "react";
import { errorLine } from "@/lib/api/explain";
import { useDialog } from "@/hooks/useDialog";
import { useRouter } from "next/navigation";
import { FilePlus2, Loader2, X } from "lucide-react";
import type { RoadmapRequest } from "@/types/roadmap";
import { api, ApiError, isLive } from "@/lib/api/client";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Turns the roadmap on screen into a draft application on the server.
 *
 * The roadmap is rebuilt by the server from the same five answers — the
 * browser's copy is never what gets filed — and stored against this applicant
 * and the rule version it was built on. Only then is the draft created.
 * Filing itself happens on the application page, after the pre-check.
 */
export function FileApplicationButton({ request, defaultProject }: { request: RoadmapRequest; defaultProject: string }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [open, setOpen] = useState(false);
  const [project, setProject] = useState(defaultProject);
  const [sample, setSample] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Same rules as every dialog: Esc and backdrop close it, focus stays inside.
  // The project name is pre-filled, so it only counts as typed once changed.
  const { ref, dismiss } = useDialog(open, () => !busy && setOpen(false), project !== defaultProject || busy);

  if (!isLive() || session?.role !== "applicant") return null;

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const rm = await api<{ data: { id: string }; stored: boolean }>("/v1/roadmap", { method: "POST", body: request as unknown as Record<string, unknown> });
      if (!rm.stored) throw new ApiError(401, "unauthorized", "Sign in again — the roadmap was not stored against you.");
      const app = await api<{ id: string }>("/v1/applications", {
        method: "POST",
        body: { roadmap_id: rm.data.id, project: project.trim(), start_from_sample: sample },
      });
      router.push(`/applications/${app.id}`);
    } catch (e) {
      setError(errorLine(e, "Could not create the application."));
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg bg-db-blue px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:brightness-95"
      >
        <FilePlus2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        Start an application
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="db-fade absolute inset-0 bg-db-ink/30" onClick={dismiss} aria-hidden />
          <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="fa-title" className="db-dialog relative w-full max-w-[460px] rounded-xl border border-db-line bg-surface p-5 shadow-[0_18px_48px_rgba(15,23,42,0.22)]">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h2 id="fa-title" className="text-[16px] font-semibold text-db-ink">
                  Start an application from this roadmap
                </h2>
                <p className="mt-1 text-[12.5px] leading-relaxed text-db-muted">
                  The server rebuilds the roadmap from your answers and keeps it against the rule version it used. Nothing is
                  filed yet — you check it first.
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-db-faint hover:text-db-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-4 block text-[12px] font-medium text-db-ink" htmlFor="fa-project">
              Project name
            </label>
            <input
              id="fa-project"
              value={project}
              onChange={(e) => setProject(e.target.value.slice(0, 200))}
              className="mt-1 h-9 w-full rounded-lg border border-db-line bg-surface px-2.5 text-[13px] text-db-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />

            <label className="mt-3 flex items-start gap-2 text-[12.5px] text-db-ink">
              <input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} className="mt-0.5" />
              <span>
                Start from the sample unit&apos;s documents
                <span className="block text-[11.5px] text-db-muted">
                  Demo convenience — it is missing one document (a board resolution), so the pre-check has one thing to catch and one upload fixes it.
                </span>
              </span>
            </label>

            {error ? <p className="mt-3 text-[12px] text-db-red">{error}</p> : null}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="h-9 rounded-lg border border-db-line px-3.5 text-[12.5px] text-db-ink">
                Cancel
              </button>
              <button
                onClick={create}
                disabled={busy || project.trim().length < 3}
                className="flex h-9 items-center gap-2 rounded-lg bg-db-blue px-3.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Create draft
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

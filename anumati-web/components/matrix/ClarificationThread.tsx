"use client";
import { useEffect, useRef, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";
import { clockOf } from "@/lib/matrix/engine";
import { useMatrixStore } from "@/store/useMatrixStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/**
 * The cross-departmental thread, pinned to the conflict.
 *
 * Without it, a rejection is a note thrown over a wall: the applicant hears
 * about it weeks later and the two departments never speak. Here the objecting
 * officer can withdraw their own rejection the moment it is settled — the node
 * goes red → processing without anyone overruling anyone.
 */
export function ClarificationThread({
  app,
  derived,
}: {
  app: ApplicationFile;
  derived: DerivedMatrixState;
}) {
  const post = useMatrixStore((s) => s.post);
  const reEvaluate = useMatrixStore((s) => s.reEvaluate);
  const speakingAs = useMatrixStore((s) => s.speakingAs);
  const setSpeakingAs = useMatrixStore((s) => s.setSpeakingAs);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [app.thread.length]);

  const rejecter = derived.rejected[0];
  const participants = [...derived.rejected, ...derived.approved, ...derived.deemed];

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    post(body, speakingAs);
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none border-b border-db-line px-4 py-2.5">
        <Label className="mb-1 block">Cross-departmental clarification</Label>
        <p className="text-[11.5px] leading-relaxed text-db-muted">
          Attached to {app.id}. Everything said here is part of the file.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {app.thread.length === 0 ? (
          <p className="text-[12px] leading-relaxed text-db-muted">
            The thread opens by itself when two departments disagree on this file. It can also be used
            before that, to ask a question rather than reject.
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          {app.thread.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border px-3 py-2",
                m.role === "system"
                  ? "border-dashed border-db-line bg-db-bg"
                  : m.dept_id === rejecter?.dept_id
                    ? "border-db-red/35 bg-db-red/[0.04]"
                    : m.role === "officer"
                      ? "border-db-blue/30 bg-db-blue-tint/40"
                      : "border-db-green/40 bg-db-green/[0.04]",
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-mono text-[10.5px] font-semibold tracking-[0.05em] text-db-ink">
                  {m.author_short}
                  {m.role !== "system" ? (
                    <span className="ml-1.5 font-sans font-normal text-db-muted">{m.author}</span>
                  ) : null}
                </span>
                <span className="font-mono text-[10px] text-db-faint">
                  d{m.day} · {clockOf(m.at)}
                </span>
              </div>
              <p className="text-[12.5px] leading-relaxed text-db-ink">{m.body}</p>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {rejecter ? (
        <div className="flex-none border-t border-db-line bg-db-green/[0.04] px-4 py-2.5">
          <Button
            variant="primary"
            className="w-full"
            onClick={() =>
              reEvaluate(
                rejecter.dept_id,
                "Compromise reached in the clarification thread — objection withdrawn, file back under review.",
              )
            }
          >
            <RefreshCw className="h-3 w-3" strokeWidth={1.6} />
            Resolve &amp; re-evaluate as {rejecter.dept_short}
          </Button>
          <p className="mt-1.5 text-[11px] leading-snug text-db-muted">
            Only {rejecter.dept_short} can withdraw its own rejection. The lane returns to processing and the
            conflict banner clears.
          </p>
        </div>
      ) : null}

      <div className="flex-none border-t border-db-line px-4 py-2.5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Label className="flex-none">Post as</Label>
          <button
            onClick={() => setSpeakingAs(null)}
            aria-pressed={speakingAs === null}
            className={cn(
              "h-6 rounded-xl border px-2 font-mono text-[10.5px] transition-colors",
              speakingAs === null
                ? "border-db-blue bg-db-blue-tint font-medium text-db-blue"
                : "border-db-line text-db-muted hover:text-db-blue",
            )}
          >
            SINGLE WINDOW
          </button>
          {participants.map((p) => (
            <button
              key={p.dept_id}
              onClick={() => setSpeakingAs(p.dept_id)}
              aria-pressed={speakingAs === p.dept_id}
              className={cn(
                "h-6 rounded-xl border px-2 font-mono text-[10.5px] transition-colors",
                speakingAs === p.dept_id
                  ? "border-db-blue bg-db-blue-tint font-medium text-db-blue"
                  : "border-db-line text-db-muted hover:text-db-blue",
              )}
            >
              {p.dept_short}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            rows={2}
            placeholder="Write to the other department…"
            aria-label="Message"
            className="flex-1 rounded-xl border border-db-line bg-surface px-2.5 py-2 text-[12.5px] leading-relaxed text-db-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <Button onClick={send} disabled={!draft.trim()} className="h-9 flex-none px-3">
            <Send className="h-3 w-3" strokeWidth={1.6} />
          </Button>
        </div>
      </div>
    </div>
  );
}

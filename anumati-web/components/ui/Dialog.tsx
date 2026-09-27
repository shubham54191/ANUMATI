"use client";
import * as React from "react";
import { X } from "lucide-react";
import { useDialog } from "@/hooks/useDialog";

/**
 * The shared dialog. Escape and the backdrop close it unless `dirty` — the
 * person has typed something — in which case only Cancel or ✕ does, so a
 * stray key never throws their words away. Focus is trapped inside and
 * returned to the opener on close.
 */
export function Dialog({
  open,
  onClose,
  title,
  dirty = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  dirty?: boolean;
  children: React.ReactNode;
}) {
  const { ref, dismiss } = useDialog(open, onClose, dirty);
  const titleId = React.useId();

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="db-fade absolute inset-0 bg-ink/20" onClick={dismiss} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="db-dialog relative w-full max-w-lg rounded-xl border border-db-line bg-surface shadow-panel"
      >
        <div className="flex items-center justify-between border-b border-db-line px-5 py-4">
          <h2 id={titleId} className="text-[19px] font-bold text-db-ink">
            {title}
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded text-db-muted hover:text-db-ink focus-visible:ring-2 focus-visible:ring-accent">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

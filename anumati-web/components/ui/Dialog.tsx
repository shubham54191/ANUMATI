"use client";
import * as React from "react";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-ink/20" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg rounded border border-line bg-surface shadow-panel"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-serif text-[19px] font-medium text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  id: string;
  label: string;
}

export function Select({
  value,
  options,
  onChange,
  className,
  id,
}: {
  value: string;
  options: readonly Option[];
  onChange: (id: string) => void;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full appearance-none rounded border border-control bg-surface",
          "px-3 pr-10 text-[14px] text-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
          "hover:border-accent/60",
        )}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted"
        strokeWidth={1.5}
      />
    </div>
  );
}

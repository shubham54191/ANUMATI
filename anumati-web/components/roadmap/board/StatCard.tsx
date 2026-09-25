import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "blue" | "green" | "purple" | "emerald";

const TONE: Record<StatTone, { tile: string; icon: string; value: string }> = {
  blue: { tile: "bg-db-blue-tint", icon: "text-db-blue", value: "text-db-ink" },
  green: { tile: "bg-db-green-tint", icon: "text-db-green", value: "text-db-green" },
  purple: { tile: "bg-db-purple-tint", icon: "text-db-purple", value: "text-db-purple" },
  emerald: { tile: "bg-db-emerald-tint", icon: "text-db-emerald", value: "text-db-green" },
};

export function StatCard({
  tone,
  Icon,
  label,
  value,
  unit,
  badge,
}: {
  tone: StatTone;
  Icon: LucideIcon;
  label: string;
  value: number | string;
  unit?: string;
  badge?: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="flex-1 rounded-xl border border-db-line bg-surface px-5 py-4">
      <div className="flex items-center gap-3">
        <span className={cn("flex h-9 w-9 flex-none items-center justify-center rounded-lg", t.tile)}>
          <Icon className={cn("h-[17px] w-[17px]", t.icon)} strokeWidth={1.8} />
        </span>
        <span className="text-[13px] font-medium leading-tight text-db-muted">{label}</span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className={cn("text-[38px] font-semibold leading-none tracking-[-0.02em]", t.value)}>
          {value}
        </span>
        {unit ? <span className="pb-1 text-[13px] text-db-muted">{unit}</span> : null}
        {badge ? <span className="flex-1 pb-1 text-right">{badge}</span> : null}
      </div>
    </div>
  );
}

export function Delta({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-db-green-tint px-2 py-[3px] text-[11.5px] font-semibold text-db-green">
      {children}
    </span>
  );
}

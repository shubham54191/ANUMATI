"use client";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

function Toggle({
  on,
  label,
  note,
  onClick,
}: {
  on: boolean;
  label: string;
  note?: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} aria-pressed={on} className="flex items-center gap-2">
      <span
        className={cn(
          "relative block h-[17px] w-[30px] rounded-full transition-colors",
          on ? "bg-ink" : "bg-control",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 block h-[13px] w-[13px] rounded-full bg-white transition-all",
            on ? "left-[15px]" : "left-0.5",
          )}
        />
      </span>
      <span className={cn("text-[12.5px]", on ? "text-ink" : "text-muted")}>{label}</span>
      {note ? (
        <span className="rounded-sm bg-state-active/[0.07] px-1.5 font-mono text-[10px] text-state-active">
          {note}
        </span>
      ) : null}
    </button>
  );
}

export function ConditionalControls({ engineVersion }: { engineVersion: string }) {
  const { conditions, employees, heightM, toggleCondition, setEmployees, setHeight } =
    useRoadmapStore();

  return (
    <div className="flex h-12 flex-none items-center gap-6 border-b border-line bg-sunk px-5">
      <Label>Conditions</Label>

      <label className="flex items-center gap-2.5">
        <span className="text-[12.5px] text-ink">Employees</span>
        <input
          type="range"
          min={1}
          max={200}
          value={employees}
          onChange={(e) => setEmployees(Number(e.target.value))}
          className="h-1 w-[120px] accent-[var(--text)]"
          aria-label="Employees"
        />
        <span className="font-num w-8 font-mono text-xs font-medium text-ink">{employees}</span>
        {}
        <span className="font-mono text-[10px] text-faint">
          {employees >= 10 ? "factory · ESI" : "below every threshold"}
        </span>
      </label>

      <label className="flex items-center gap-2.5">
        <span className="text-[12.5px] text-ink">Built height</span>
        <input
          type="range"
          min={4}
          max={40}
          value={heightM}
          onChange={(e) => setHeight(Number(e.target.value))}
          className="h-1 w-24 accent-[var(--text)]"
          aria-label="Built height in metres"
        />
        <span className="font-num w-10 font-mono text-xs font-medium text-ink">{heightM} m</span>
      </label>

      <Toggle
        on={conditions.boiler}
        label="Steam boiler on site"
        note={conditions.boiler ? "+1 approval" : undefined}
        onClick={() => toggleCondition("boiler")}
      />
      <Toggle
        on={conditions.export}
        label="Exports produce"
        onClick={() => toggleCondition("export")}
      />

      <div className="flex-1" />
      <span className="font-mono text-[11px] text-faint" title={`Engine ${engineVersion}`}>
        Recomputed on change
      </span>
    </div>
  );
}

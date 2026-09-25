import { CircleCheck, Clock, FileText, Lightbulb, Network } from "lucide-react";
import type { Roadmap } from "@/types/roadmap";

export function KeyInsightsCard({ roadmap }: { roadmap: Roadmap }) {
  const saved = roadmap.sequential_days - roadmap.optimised_days;
  const savedPct = roadmap.sequential_days ? (saved / roadmap.sequential_days) * 100 : 0;

  const widest = Math.max(...roadmap.batches.map((b) => b.approvals.length));
  const byId = new Map(roadmap.approvals.map((a) => [a.id, a]));
  const longest = roadmap.critical_path
    .map((id) => byId.get(id))
    .filter(Boolean)
    .sort((a, b) => b!.statutory_days - a!.statutory_days)
    .slice(0, 2)
    .map((a) => a!.name);

  const ITEMS = [
    {
      Icon: Clock,
      tint: "bg-db-emerald-tint",
      color: "text-db-emerald",
      title: "Time saved",
      body: `${saved} days (${savedPct.toFixed(1)}%)`,
    },
    {
      Icon: Network,
      tint: "bg-db-blue-tint",
      color: "text-db-blue",
      title: "Parallel processing across departments",
      body: `Up to ${widest} filings move on the same day`,
    },
    {
      Icon: FileText,
      tint: "bg-db-purple-tint",
      color: "text-db-purple",
      title: "Focus on critical path",
      body: longest.join(" & ") || "The chain that sets the finish date",
    },
    {
      Icon: CircleCheck,
      tint: "bg-db-green-tint",
      color: "text-db-green",
      title: "Better coordination",
      body: "Faster approvals, lower compliance risk",
    },
  ];

  return (
    <div className="rounded-xl border border-db-line bg-surface px-5 py-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-db-blue" strokeWidth={1.8} />
        <span className="text-[14px] font-semibold text-db-ink">Key Insights</span>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {ITEMS.map((it) => (
          <div key={it.title} className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${it.tint}`}
            >
              <it.Icon className={`h-[15px] w-[15px] ${it.color}`} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="text-[12.5px] font-semibold leading-tight text-db-ink">{it.title}</div>
              <div className="mt-0.5 text-[11.5px] leading-snug text-db-muted">{it.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

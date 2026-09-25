import type { Dependency } from "@/types/dependency";
import { EDGE_TYPES } from "@/types/dependency";
import { EDGE_SPEC } from "@/lib/constants/edgeTypes";

const DOT: Record<string, string> = {
  statutory: "bg-db-navy",
  documentary: "bg-db-blue",
  physical: "bg-db-teal",
  practice: "bg-db-faint",
};

/** Counted from the data every render. Never a hardcoded number. */
export function DependencyEvidenceCard({ dependencies }: { dependencies: Dependency[] }) {
  return (
    <div className="w-[296px] flex-none rounded-xl border border-db-line bg-surface px-5 py-4">
      <div className="text-[14px] font-semibold text-db-ink">Dependency Evidence</div>
      <div className="mt-1.5 text-[20px] font-semibold leading-none text-db-ink">
        {dependencies.length}{" "}
        <span className="text-[13px] font-normal text-db-muted">filings</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EDGE_TYPES.map((t) => {
          const n = dependencies.filter((d) => d.edge_type === t).length;
          return (
            <span
              key={t}
              title={EDGE_SPEC[t].blurb}
              className="inline-flex items-center gap-1.5 rounded-full border border-db-line bg-db-bg px-2.5 py-1 text-[11.5px] text-db-muted"
            >
              <span className={`h-[6px] w-[6px] flex-none rounded-full ${DOT[t]}`} />
              <span className="font-semibold text-db-ink">{n}</span>
              {EDGE_SPEC[t].label.split(" —")[0].toLowerCase()}
            </span>
          );
        })}
      </div>
    </div>
  );
}

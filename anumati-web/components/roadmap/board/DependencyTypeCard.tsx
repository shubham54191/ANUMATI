import type { Roadmap } from "@/types/roadmap";
import { EDGE_TYPES } from "@/types/dependency";
import { EDGE_SPEC } from "@/lib/constants/edgeTypes";

export function DependencyTypeCard({ roadmap }: { roadmap: Roadmap }) {
  return (
    <div className="rounded-xl border border-db-line bg-surface px-5 py-4">
      <div className="text-[14px] font-semibold text-db-ink">Dependency Type</div>

      <div className="mt-3 flex flex-col gap-2.5">
        {EDGE_TYPES.map((t) => {
          const spec = EDGE_SPEC[t];
          const n = roadmap.dependencies.filter((d) => d.edge_type === t).length;
          return (
            <div key={t} className="flex items-center gap-3">
              <span className="flex h-[10px] w-[30px] flex-none items-center">
                <span
                  className="w-full"
                  style={
                    spec.dashed
                      ? { borderTop: `2px dashed var(${spec.colorVar})` }
                      : { height: `${spec.strokeWidth}px`, background: `var(${spec.colorVar})`, borderRadius: 2 }
                  }
                />
              </span>
              <span className="flex-1 text-[12.5px] text-db-muted">{spec.label}</span>
              <span className="font-num text-[12.5px] font-semibold text-db-ink">{n}</span>
            </div>
          );
        })}

        <div className="flex items-center gap-3">
          <span className="flex h-[10px] w-[30px] flex-none items-center">
            <span className="w-full rounded-sm" style={{ height: 2.5, background: "var(--db-red)" }} />
          </span>
          <span className="flex-1 text-[12.5px] text-db-muted">Critical Path</span>
          <span className="font-num text-[12.5px] font-semibold text-db-ink">
            {roadmap.critical_path.length}
          </span>
        </div>
      </div>
    </div>
  );
}

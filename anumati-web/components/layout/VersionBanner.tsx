import type { Meta } from "@/types/api";

export function VersionBanner({ meta }: { meta: Meta }) {
  return (
    <div className="flex h-6 flex-none items-center gap-2 whitespace-nowrap border-l border-line pl-[18px]">
      <span className="font-mono text-[11px] text-muted">
        Rules {meta.rules_version} · {meta.approvals_count} approvals ·
      </span>
      <span className="font-mono text-[11px] font-medium text-state-deemed-ink">
        {meta.flagged_count} flagged
      </span>
    </div>
  );
}

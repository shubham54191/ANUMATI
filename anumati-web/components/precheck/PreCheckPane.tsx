"use client";
import type { Roadmap } from "@/types/roadmap";
import { RiskCard } from "./RiskCard";
import { ReadinessList } from "./ReadinessList";
import { InspectionSummary } from "./InspectionSummary";
import { RenewalBoard } from "./RenewalBoard";

/**
 * Everything that happens around a filing rather than inside one.
 *
 * Four questions a portal cannot answer today: will this file be accepted,
 * how hard will it be scrutinised, how many times will somebody visit the
 * site, and when does all of it expire.
 */
export function PreCheckPane({ roadmap }: { roadmap: Roadmap }) {
  return (
    <div className="h-full overflow-y-auto bg-bg">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-5 px-5 py-5">
        <ReadinessList roadmap={roadmap} />
        <RiskCard />
        <InspectionSummary roadmap={roadmap} />
        <RenewalBoard />
      </div>
    </div>
  );
}

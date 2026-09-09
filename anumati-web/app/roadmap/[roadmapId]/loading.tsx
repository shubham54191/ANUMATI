import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <div className="h-14 flex-none border-b border-line bg-surface" />
      <div className="h-[52px] flex-none border-b border-line bg-surface" />

      <div className="flex h-[104px] flex-none items-center gap-9 border-b border-line bg-surface px-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>

      <div className="h-12 flex-none border-b border-line bg-sunk" />

      <div className="flex-1 space-y-10 p-6">
        {[5, 4, 5, 4].map((count, lane) => (
          <div key={lane} className="flex gap-10">
            <Skeleton className="h-3 w-16" />
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-[76px] w-[200px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

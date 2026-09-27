"use client";
import Link from "next/link";
import { ServerOff } from "lucide-react";
import { isLive } from "@/lib/api/client";

/**
 * Pages that only make sense with a server behind them. In the offline demo
 * they say so plainly rather than pretending — nothing would be stored.
 */
export function LiveOnly({ what, children }: { what: string; children: React.ReactNode }) {
  if (isLive()) return <>{children}</>;
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-db-bg px-4">
      <div className="flex max-w-[440px] flex-col items-center gap-3 text-center">
        <ServerOff className="h-8 w-8 text-db-faint" strokeWidth={1.5} />
        <p className="text-[15px] font-semibold text-db-ink">{what} needs the ANUMATI server</p>
        <p className="text-[13px] leading-relaxed text-db-muted">
          This build is the offline demo: everything runs in your browser and nothing is stored. Start the server and set
          NEXT_PUBLIC_ANUMATI_API to file, track and sign for real.
        </p>
        <Link href="/roadmap/new" className="text-[13px] font-medium text-db-blue">
          Back to the roadmap
        </Link>
      </div>
    </div>
  );
}

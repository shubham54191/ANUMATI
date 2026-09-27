import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found — ANUMATI",
  robots: { index: false, follow: false },
};

/**
 * A 404 that does something. Whoever lands here is either an applicant or an
 * officer, and both have exactly one place to go, so the page says which link
 * is theirs instead of offering a generic "go home".
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-db-bg px-6 py-16">
      <div className="w-full max-w-[520px]">
        <p className="font-mono text-[11px] tracking-[0.14em] text-db-faint">ERROR 404</p>
        <h1 className="mt-3 text-[28px] font-semibold leading-tight text-db-ink">
          That page is not here
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-db-muted">
          The address may have changed, or the link that brought you here may be out of date.
          Nothing has gone wrong with your application.
        </p>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/roadmap/new"
            className="flex h-11 flex-1 items-center justify-center rounded-lg bg-db-blue px-5 text-[14px] font-semibold text-white no-underline transition-opacity hover:opacity-90"
          >
            Build an approval roadmap
          </Link>
          <Link
            href="/login"
            className="flex h-11 flex-1 items-center justify-center rounded-lg border border-db-line bg-surface px-5 text-[14px] font-medium text-db-ink no-underline transition-colors hover:border-db-blue hover:text-db-blue"
          >
            Sign in as an officer
          </Link>
        </div>

        <p className="mt-6 text-[12.5px] text-db-faint">
          Looking for the open standard?{" "}
          <Link href="/standard" className="text-db-blue underline-offset-2 hover:underline">
            The OAGS schema and validator
          </Link>{" "}
          are public.
        </p>
      </div>
    </main>
  );
}

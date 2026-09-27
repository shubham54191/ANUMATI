import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to ANUMATI as a single-window facilitation officer or as an applicant.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

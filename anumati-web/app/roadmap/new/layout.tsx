import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "New roadmap",
  description:
    "Five answers and you get every approval your unit needs, in the order the law requires.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

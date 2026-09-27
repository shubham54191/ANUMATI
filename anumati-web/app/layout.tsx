import type { Metadata } from "next";
import { ALLOW_INDEXING, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const DESCRIPTION =
  "Approval roadmaps for setting up a business in Maharashtra, with the section of the act behind every rule. Sequencing, pre-submission checks, parallel departmental review and conflict resolution.";

export const metadata: Metadata = {
  // Every relative URL below — the social image, the canonical link — is
  // resolved against this. Without it Open Graph tags ship as relative paths,
  // which no scraper follows.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    // Pages set a short title; this frames it, so no page repeats the brand.
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "industrial approvals",
    "single window",
    "Maharashtra",
    "MAITRI Act 2023",
    "regulatory compliance",
    "approval roadmap",
    "critical path",
    "OAGS",
  ],
  authors: [{ name: "Team ANUMATI" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: DESCRIPTION,
  },
  // Unlisted unless someone turns indexing on. robots.txt reads the same flag.
  robots: ALLOW_INDEXING
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Poppins:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

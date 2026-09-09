import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANUMATI — every approval, in the order the law requires",
  description:
    "Approval roadmaps for setting up a business in Maharashtra, with the section of the act behind every rule.",
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
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

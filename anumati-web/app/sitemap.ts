import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Only the pages a stranger can actually open.
 *
 * A roadmap URL carries an id and a query string describing one project, and
 * an officer's console needs a session, so neither belongs in a sitemap — a
 * crawler would index a sign-in page and call it content.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/roadmap/new`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/standard`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];
}

import type { MetadataRoute } from "next";
import { ALLOW_INDEXING, SITE_URL } from "@/lib/site";

/**
 * What a crawler may read.
 *
 * The public half — the sign-in, the roadmap wizard, the open standard — is
 * meant to be found. Everything behind sign-in is not: an officer's queue and
 * an applicant's filed applications have nothing to offer a search index, and
 * a crawler following those links only produces sign-in pages in the results.
 * The API is excluded for the same reason, plus one of its own: the validator
 * accepts POSTs and there is no sense inviting a crawler to try.
 */
export default function robots(): MetadataRoute.Robots {
  // Unlisted by default — see ALLOW_INDEXING. The page metadata reads the same
  // flag, so robots.txt and the meta tags always say the same thing.
  if (!ALLOW_INDEXING) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/roadmap/new", "/standard"],
        disallow: ["/api/", "/matrix", "/applications", "/committee", "/rules", "/roadmap/RM-"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

/**
 * Where this deployment lives.
 *
 * Absolute URLs are needed in three places a relative path will not do:
 * `metadataBase` for Open Graph tags, the sitemap, and robots.txt. Vercel sets
 * VERCEL_PROJECT_PRODUCTION_URL on every deployment, so a preview build does
 * not advertise itself as the production site; NEXT_PUBLIC_SITE_URL overrides
 * both once there is a real domain.
 */
function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  // Local development. Nothing is indexed from here, so the value only has to
  // be a valid absolute URL.
  return "http://localhost:3000";
}

export const SITE_URL = resolve();

/** Shown wherever the product names itself to something other than a person. */
export const SITE_NAME = "ANUMATI";
export const SITE_TAGLINE = "Every approval, in the order the law requires";

/**
 * Whether search engines may index this deployment. Off unless asked.
 *
 * The sign-in screen carries "Government of India" and a ministry's name, and
 * the rule base is seeded pilot data. Indexed, it could be found by somebody
 * looking for the state's real service. That is a worse failure than not being
 * found at all, so a build is unlisted until someone decides otherwise:
 *
 *   NEXT_PUBLIC_ALLOW_INDEXING=true
 *
 * robots.txt and the page metadata both read this, so the two cannot disagree.
 */
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

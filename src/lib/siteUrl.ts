// The site's canonical origin, in one place.
//
// Sitemap entries, robots.txt and metadataBase all need an absolute URL, and
// they must agree — a sitemap on one host pointing at pages on another is worse
// than no sitemap. Resolution order:
//
//   1. NEXT_PUBLIC_SITE_URL — set this when a custom domain is bought, and
//      every absolute URL on the site follows without touching code.
//   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel injects the production hostname,
//      so deploys are correct before any domain exists.
//   3. localhost — development.

function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  // Vercel supplies a bare hostname, no protocol.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolve();

/** Absolute URL for a site-relative path, e.g. absoluteUrl("/guide"). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

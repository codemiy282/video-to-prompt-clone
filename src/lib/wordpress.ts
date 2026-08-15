// Reads published posts from WordPress over its REST API.
//
// WordPress is the editor and the approval gate — n8n writes drafts, a human
// publishes them in wp-admin. Nothing renders WordPress's own front end: these
// pages are drawn by this app, so /blog inherits the header, footer, three
// languages, dark mode and sitemap that already exist instead of needing a
// theme that would have to be kept in sync by hand.
//
// Only published posts are ever requested. Drafts stay invisible, which is what
// makes the draft state a usable review step.

const REVALIDATE_SECONDS = 300;

/** Shape we expose to pages — a small, stable subset of WordPress's payload. */
export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  /** Rendered HTML from WordPress. */
  content: string;
  /** Rendered HTML excerpt, tags stripped by WordPress already. */
  excerpt: string;
  /** ISO date string. */
  date: string;
  featuredImage?: { url: string; alt: string };
}

interface WpRendered {
  rendered?: string;
}

interface WpPost {
  id?: number;
  slug?: string;
  date_gmt?: string;
  title?: WpRendered;
  content?: WpRendered;
  excerpt?: WpRendered;
  _embedded?: {
    "wp:featuredmedia"?: { source_url?: string; alt_text?: string }[];
  };
}

function baseUrl(): string | null {
  const raw = process.env.WP_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/** Whether a WordPress backend is configured at all. */
export function blogEnabled(): boolean {
  return baseUrl() !== null;
}

/**
 * WordPress escapes entities in rendered titles (&#8217; and friends). Titles
 * are printed as text, not HTML, so decode the handful that actually show up.
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function toPost(raw: WpPost): BlogPost | null {
  if (!raw?.id || !raw.slug) return null;
  const media = raw._embedded?.["wp:featuredmedia"]?.[0];
  return {
    id: raw.id,
    slug: raw.slug,
    title: decodeEntities(raw.title?.rendered ?? ""),
    content: raw.content?.rendered ?? "",
    excerpt: decodeEntities((raw.excerpt?.rendered ?? "").replace(/<[^>]*>/g, "")).trim(),
    date: raw.date_gmt ? `${raw.date_gmt}Z` : new Date().toISOString(),
    featuredImage: media?.source_url
      ? { url: media.source_url, alt: media.alt_text ?? "" }
      : undefined,
  };
}

/**
 * Fetch from WordPress, returning null rather than throwing.
 *
 * The blog must never take the rest of the site down: during local development
 * WordPress is often simply not running, and a build should not fail because of
 * it. Callers render an empty state instead.
 */
async function wpFetch(path: string): Promise<unknown | null> {
  const base = baseUrl();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/wp-json/wp/v2/${path}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["blog"] },
    });
    if (!res.ok) {
      console.error(`[blog] WordPress replied ${res.status} for ${path}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[blog] WordPress unreachable for ${path}:`, err);
    return null;
  }
}

/** Published posts, newest first. Empty when WordPress is absent or failing. */
export async function listPosts(perPage = 20): Promise<BlogPost[]> {
  const data = await wpFetch(
    `posts?status=publish&per_page=${perPage}&orderby=date&order=desc&_embed=wp:featuredmedia`
  );
  if (!Array.isArray(data)) return [];
  return data.map((p) => toPost(p as WpPost)).filter((p): p is BlogPost => p !== null);
}

/** One published post by slug, or null when it does not exist. */
export async function getPost(slug: string): Promise<BlogPost | null> {
  const data = await wpFetch(
    `posts?status=publish&slug=${encodeURIComponent(slug)}&_embed=wp:featuredmedia`
  );
  if (!Array.isArray(data) || data.length === 0) return null;
  return toPost(data[0] as WpPost);
}

/** Slugs for the sitemap. */
export async function listPostSlugs(): Promise<{ slug: string; date: string }[]> {
  const data = await wpFetch("posts?status=publish&per_page=100&_fields=slug,date_gmt");
  if (!Array.isArray(data)) return [];
  return data
    .map((p) => p as { slug?: string; date_gmt?: string })
    .filter((p): p is { slug: string; date_gmt?: string } => Boolean(p.slug))
    .map((p) => ({
      slug: p.slug,
      date: p.date_gmt ? `${p.date_gmt}Z` : new Date().toISOString(),
    }));
}

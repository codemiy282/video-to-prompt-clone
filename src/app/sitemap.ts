import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * Every route worth indexing, with a priority reflecting what the site is for.
 *
 * `/image-to-video` is deliberately absent. That route returns a random stock
 * clip rather than a generated one (see api/ltx-video/route.ts, "DUMMY MODE"),
 * and submitting a page that does not do what it says to a search engine risks
 * the whole domain, not just that page. Leave it reachable, do not advertise
 * it — revisit if the feature becomes real.
 */
const ROUTES: { path: string; priority: number; changeFrequency: "monthly" | "yearly" }[] = [
  // The product itself.
  { path: "/", priority: 1.0, changeFrequency: "monthly" },
  // Documentation — the page most likely to earn links.
  { path: "/guide", priority: 0.9, changeFrequency: "monthly" },

  // Tools. Each one is a distinct search intent.
  { path: "/projects", priority: 0.8, changeFrequency: "monthly" },
  { path: "/storyboard", priority: 0.8, changeFrequency: "monthly" },
  { path: "/validator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/prompt-converter", priority: 0.8, changeFrequency: "monthly" },
  { path: "/image-to-prompt", priority: 0.8, changeFrequency: "monthly" },
  { path: "/models", priority: 0.7, changeFrequency: "monthly" },

  // Per-model landing pages.
  { path: "/veo", priority: 0.7, changeFrequency: "monthly" },
  { path: "/kling", priority: 0.7, changeFrequency: "monthly" },
  { path: "/runway", priority: 0.7, changeFrequency: "monthly" },
  { path: "/seedance", priority: 0.7, changeFrequency: "monthly" },

  { path: "/feedback", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Build time. Accurate enough for a site that redeploys on every change, and
  // it avoids claiming a freshness the content does not have.
  const lastModified = new Date();

  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency,
    priority,
  }));
}

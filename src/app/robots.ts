import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The API answers POSTs only and holds nothing worth indexing; _next is
      // build output. Neither should spend a crawler's budget.
      disallow: ["/api/", "/_next/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}

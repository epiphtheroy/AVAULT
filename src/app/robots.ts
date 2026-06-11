import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

// Only editorially approved columns are indexable (spec Section 7).
// /admin and /api are never indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

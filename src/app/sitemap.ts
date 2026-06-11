import type { MetadataRoute } from "next";
import { getAllPublishedSlugs } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllPublishedSlugs();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/vault`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/reopening`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/methodology`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const articles: MetadataRoute.Sitemap = slugs.map((s) => ({
    url: `${siteUrl}/article/${s.url_slug}`,
    lastModified: s.published_at ? new Date(s.published_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...articles];
}

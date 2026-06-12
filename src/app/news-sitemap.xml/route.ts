import { getRecentForNews } from "@/lib/data";

export const revalidate = 600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Google News sitemap: articles from the last 48h only (Top Stories eligibility).
export async function GET() {
  const articles = await getRecentForNews(48);
  const items = articles
    .filter((a) => a.url_slug && a.published_at)
    .map(
      (a) => `  <url>
    <loc>${siteUrl}/article/${a.url_slug}</loc>
    <news:news>
      <news:publication>
        <news:name>AVAULT</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.published_at!).toISOString()}</news:publication_date>
      <news:title>${esc(a.headline ?? "")}</news:title>
    </news:news>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
}

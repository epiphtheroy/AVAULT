import { getLatestArticles } from "@/lib/data";

export const revalidate = 1800;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const articles = await getLatestArticles(30);
  const items = articles
    .map(
      (a) => `    <item>
      <title>${esc(a.headline ?? "")}</title>
      <link>${siteUrl}/article/${a.url_slug}</link>
      <guid isPermaLink="true">${siteUrl}/article/${a.url_slug}</guid>
      <description>${esc(a.deck ?? a.summary_line ?? "")}</description>
      <author>thinkartist1@gmail.com (Wonwoo Yoon)</author>
      <pubDate>${a.published_at ? new Date(a.published_at).toUTCString() : ""}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AVAULT</title>
    <link>${siteUrl}</link>
    <description>Daily political-ethical verdicts on the day's biggest news, by Wonwoo Yoon.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}

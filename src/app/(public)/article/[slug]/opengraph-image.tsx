import { ImageResponse } from "next/og";
import { getArticleBySlug } from "@/lib/data";

export const runtime = "edge";
export const alt = "AVAULT verdict";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded OG card: red masthead block + literary headline (Discover/social/AI surfaces).
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  const headline = article?.headline ?? "A vault for judgment";
  const kicker = article?.topic_tags?.[0]?.toUpperCase() ?? "VERDICT";
  const date = article?.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            backgroundColor: "#e3120b",
            padding: "36px 64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ color: "#fff", fontSize: 56, fontWeight: 800, letterSpacing: -1, fontFamily: "Arial, sans-serif" }}>
            AVAULT
          </div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 22, letterSpacing: 4, fontFamily: "Arial, sans-serif" }}>
            ONE VERDICT AT A TIME
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "48px 64px", flex: 1 }}>
          <div style={{ color: "#e3120b", fontSize: 24, fontWeight: 700, letterSpacing: 3, fontFamily: "Arial, sans-serif" }}>
            {kicker}
          </div>
          <div
            style={{
              marginTop: 20,
              color: "#0d0d0d",
              fontSize: headline.length > 70 ? 52 : 62,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 1050,
            }}
          >
            {headline}
          </div>
          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#3d3d3d", fontSize: 26 }}>By Wonwoo Yoon</div>
            <div style={{ color: "#757575", fontSize: 24 }}>{date}</div>
          </div>
        </div>
        <div style={{ height: 14, backgroundColor: "#e3120b" }} />
      </div>
    ),
    size
  );
}

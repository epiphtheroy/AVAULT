// Post-publish SEO plumbing (editor approval 2026-06-12).

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

/** IndexNow ping: instant indexing for Bing, Naver, Yandex, Seznam (Google ignores it;
 *  Google is covered by sitemap freshness + GSC). Non-fatal by design. */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || urls.length === 0) return;
  try {
    await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteUrl()).host,
        key,
        keyLocation: `${siteUrl()}/indexnow-key.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // never block publishing on a ping
  }
}

/** Fire an internal pipeline endpoint without awaiting completion. */
export function fireInternal(path: string, body: Record<string, unknown>): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  fetch(`${siteUrl()}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  }).catch(() => undefined);
}

/** Validate a model-proposed YouTube URL via oEmbed (no API key; 200 = real video).
 *  Returns canonical data or null — hallucinated IDs never reach the page. */
export async function validateYouTube(url: string | null | undefined, fallbackTitle?: string):
  Promise<{ url: string; title: string; thumbnail?: string } | null> {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (!m) return null;
  const canonical = `https://www.youtube.com/watch?v=${m[1]}`;
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(canonical)}&format=json`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      url: canonical,
      title: (data.title as string) || fallbackTitle || "Related video",
      thumbnail: data.thumbnail_url as string | undefined,
    };
  } catch {
    return null;
  }
}

/** Official YouTube Data API search: deterministic fallback when the model's research
 *  surfaced no usable video. Returns the most relevant embeddable result or null. */
export async function searchYouTube(query: string):
  Promise<{ url: string; title: string; thumbnail?: string } | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !query.trim()) return null;
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query.slice(0, 100),
      type: "video",
      maxResults: "3",
      order: "relevance",
      relevanceLanguage: "en",
      safeSearch: "moderate",
      videoEmbeddable: "true",
      videoDuration: "medium", // 4-20 min: filters shorts and junk
      key,
    });
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const item = (data.items ?? []).find(
      (i: { id?: { videoId?: string }; snippet?: { title?: string } }) =>
        i.id?.videoId && !/#shorts/i.test(i.snippet?.title ?? "")
    );
    if (!item?.id?.videoId) return null;
    return {
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: item.snippet?.title ?? "Related video",
      thumbnail: item.snippet?.thumbnails?.medium?.url,
    };
  } catch {
    return null;
  }
}

/** Everything that should happen the moment an article goes live. */
export function afterPublish(slug: string, articleId: string): void {
  const url = `${siteUrl()}/article/${slug}`;
  void pingIndexNow([url, `${siteUrl()}/`, `${siteUrl()}/vault`]);
  fireInternal("/api/pipeline/backfill-links", { articleId });
}

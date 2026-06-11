// Dependency-free RSS/Atom item extraction for the detect job.

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  byline: string | null;
}

export const DEFAULT_FEEDS: { outlet: string; url: string }[] = [
  { outlet: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" },
  { outlet: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { outlet: "The Guardian", url: "https://www.theguardian.com/world/rss" },
  { outlet: "The Guardian", url: "https://www.theguardian.com/us-news/rss" },
  { outlet: "The Washington Post", url: "https://feeds.washingtonpost.com/rss/world" },
  { outlet: "The Washington Post", url: "https://feeds.washingtonpost.com/rss/politics" },
  { outlet: "Financial Times", url: "https://www.ft.com/rss/home" },
  { outlet: "The Economist", url: "https://www.economist.com/finance-and-economics/rss.xml" },
  { outlet: "The Economist", url: "https://www.economist.com/international/rss.xml" },
];

function tag(xml: string, name: string): string | null {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return null;
  return decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  for (const block of blocks) {
    const title = tag(block, "title");
    let link = tag(block, "link");
    if (!link) {
      const href = block.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? href[1] : null;
    }
    if (!title || !link) continue;
    items.push({
      title,
      link: link.split("?")[0],
      pubDate: tag(block, "pubDate") ?? tag(block, "updated") ?? tag(block, "published"),
      description: tag(block, "description") ?? tag(block, "summary"),
      byline: tag(block, "dc:creator") ?? tag(block, "author"),
    });
  }
  return items;
}

/** Cheap story clustering: significant title words, sorted, joined. Same event across outlets lands close. */
export function clusterId(title: string): string {
  const stop = new Set(["the","a","an","of","in","on","to","for","and","as","at","by","with","from","is","are","was","were","be","after","over","amid","its","his","her","their","new","says","say"]);
  const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w))
    .sort()
    .slice(0, 5);
  return words.join("-") || title.toLowerCase().slice(0, 40);
}

export async function fetchFeed(url: string, outlet: string): Promise<(FeedItem & { outlet: string })[]> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "AVAULT/1.0 (+https://avault.news)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseFeed(xml).map((i) => ({ ...i, outlet }));
  } catch {
    return [];
  }
}

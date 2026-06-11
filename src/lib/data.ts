// Public-site data layer. Uses the anon client; RLS exposes only published articles.
// Null-safe when env is missing (e.g., CI builds without Supabase).

import { supabaseAnon } from "./supabase/server";
import type { Article } from "./types";

const PUBLISHED = ["PUBLISHED", "OUTREACH_PENDING", "OUTREACH_DRAFTED", "OUTREACH_APPROVED", "SENT", "TRACKING"];

export async function getLatestArticles(limit = 3): Promise<Article[]> {
  const db = supabaseAnon();
  if (!db) return [];
  const { data } = await db
    .from("articles")
    .select("*")
    .in("status", PUBLISHED)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as Article[]) ?? [];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const db = supabaseAnon();
  if (!db) return null;
  const { data } = await db
    .from("articles")
    .select("*")
    .eq("url_slug", slug)
    .in("status", PUBLISHED)
    .maybeSingle();
  return (data as Article) ?? null;
}

export interface VaultFilters {
  q?: string;
  tag?: string;
  intervention?: string;
  page?: number;
}

export async function getVaultArticles(filters: VaultFilters): Promise<{ articles: Article[]; total: number }> {
  const db = supabaseAnon();
  if (!db) return { articles: [], total: 0 };
  const pageSize = 20;
  const page = Math.max(1, filters.page ?? 1);

  let query = db
    .from("articles")
    .select("*", { count: "exact" })
    .in("status", PUBLISHED)
    .order("published_at", { ascending: false });

  if (filters.tag) query = query.contains("topic_tags", [filters.tag]);
  if (filters.intervention) query = query.eq("intervention_type", filters.intervention);
  if (filters.q) {
    const q = filters.q.replace(/[%_]/g, "");
    query = query.or(`headline.ilike.%${q}%,deck.ilike.%${q}%,summary_line.ilike.%${q}%,body_md.ilike.%${q}%`);
  }

  const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  return { articles: (data as Article[]) ?? [], total: count ?? 0 };
}

export async function getReopenings(): Promise<Article[]> {
  const db = supabaseAnon();
  if (!db) return [];
  const { data } = await db
    .from("articles")
    .select("*")
    .eq("is_reopening", true)
    .in("status", PUBLISHED)
    .order("published_at", { ascending: false });
  return (data as Article[]) ?? [];
}

export async function getRelatedArticles(article: Article, limit = 4): Promise<Article[]> {
  const db = supabaseAnon();
  if (!db || !article.topic_tags?.length) return [];
  const { data } = await db
    .from("articles")
    .select("*")
    .in("status", PUBLISHED)
    .overlaps("topic_tags", article.topic_tags)
    .neq("id", article.id)
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as Article[]) ?? [];
}

export async function getAllPublishedSlugs(): Promise<{ url_slug: string; published_at: string }[]> {
  const db = supabaseAnon();
  if (!db) return [];
  const { data } = await db
    .from("articles")
    .select("url_slug, published_at")
    .in("status", PUBLISHED)
    .not("url_slug", "is", null)
    .order("published_at", { ascending: false })
    .limit(5000);
  return (data as { url_slug: string; published_at: string }[]) ?? [];
}

import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import type { Article, DigestEntry, SourceRef, Story } from "@/lib/types";
import { EditorClient } from "@/components/admin/EditorClient";

export const dynamic = "force-dynamic";

interface Version {
  id: string;
  headline: string | null;
  note: string | null;
  created_at: string;
  body_md: string | null;
  deck: string | null;
  summary_line: string | null;
}

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await supabaseServer();

  const { data: article } = await db.from("articles").select("*").eq("id", id).single();
  if (!article) notFound();

  const [storyRes, versionsRes, digestRes, settingRes] = await Promise.all([
    article.story_id
      ? db.from("stories").select("*").eq("id", article.story_id).single()
      : Promise.resolve({ data: null }),
    db.from("article_versions").select("id, headline, deck, summary_line, body_md, note, created_at").eq("article_id", id).order("created_at", { ascending: false }),
    db.from("recent_digest").select("*"),
    db.from("app_settings").select("value").eq("key", "auto_publish_minutes").maybeSingle(),
  ]);

  return (
    <EditorClient
      article={article as Article}
      story={(storyRes.data as Story) ?? null}
      versions={(versionsRes.data as Version[]) ?? []}
      digest={(digestRes.data as DigestEntry[]) ?? []}
      sources={(article.sources_json as SourceRef[]) ?? []}
      autoPublishMin={settingRes.data ? Number(settingRes.data.value) : 30}
    />
  );
}

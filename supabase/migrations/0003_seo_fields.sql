-- SEO/GEO build (editor approval 2026-06-12): per-article search metadata,
-- FAQ blocks, social drafts.

alter table articles add column if not exists seo_title text;
alter table articles add column if not exists seo_description text;
alter table articles add column if not exists faq_json jsonb default '[]'::jsonb;
alter table articles add column if not exists social_json jsonb;

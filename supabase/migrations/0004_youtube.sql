-- Related YouTube video per article (editor request 2026-06-12).
alter table articles add column if not exists youtube_json jsonb;

-- Korean review translations + 30-minute auto-accept / auto-publish (editor decision 2026-06-12,
-- overriding spec §9.6 by the editor's standing rule; configurable via app_settings).

alter table stories add column if not exists ko_review_md text;
alter table stories add column if not exists shortlisted_at timestamptz;
alter table articles add column if not exists ko_review_md text;
alter table articles add column if not exists review_requested_at timestamptz;

insert into app_settings (key, value) values
  ('auto_accept_minutes', '30'),
  ('auto_publish_minutes', '30'),
  ('last_selection_date', '""')
on conflict (key) do nothing;

-- 5-minute heartbeat that drives timers (Vercel Hobby cron is daily-only, so pg_cron does it).
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'avault-auto-actions',
  '*/5 * * * *',
  $$ select net.http_get(
       'https://avault.news/api/cron/auto-actions',
       headers := '{"Authorization": "Bearer a759a987dfcd8b0926ff89af30e6e4e39ac8f1e0e70ab7b7"}'::jsonb,
       timeout_milliseconds := 8000
     ) $$
);

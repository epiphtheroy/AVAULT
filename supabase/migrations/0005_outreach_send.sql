-- Phase 2 sending master switch (editor enabled full-auto outreach send, 2026-06-14).
-- 0 = off (default). The cron heartbeat and the send route both refuse to send while 0,
-- so deploying this code changes nothing until you flip the switch below.

insert into app_settings (key, value) values
  ('outreach_send_enabled', '0')
on conflict (key) do nothing;

-- To BEGIN sending (run only after Gmail OAuth env vars are set in Vercel):
--   1. start a 14-day warm-up (<=10/day), then it lifts to daily_email_cap (30/day):
--        update app_settings set value = to_jsonb((now() + interval '14 days')::text)
--          where key = 'warmup_until';
--   2. turn the switch on:
--        update app_settings set value = '1' where key = 'outreach_send_enabled';
--
-- To pause sending at any time:
--   update app_settings set value = '0' where key = 'outreach_send_enabled';

-- AVAULT initial schema (spec Section 8)
-- Pipeline states span stories (early) and articles (late). One enum, full visibility.

create type pipeline_status as enum (
  'DETECTED','SHORTLISTED','SELECTED','RESEARCHING','DRAFTED','GATED','IN_REVIEW',
  'APPROVED','PUBLISHED','OUTREACH_PENDING','OUTREACH_DRAFTED','OUTREACH_APPROVED',
  'SENT','TRACKING','REJECTED','KILLED'
);

create type contact_email_status as enum ('FOUND','GUESSED','MISSING');
create type outreach_status as enum ('DRAFTED','APPROVED','REJECTED','SENT','BOUNCED','REPLIED','OPTED_OUT');

create table stories (
  id uuid primary key default gen_random_uuid(),
  cluster_id text,
  outlet text not null,
  url text not null unique,
  headline text not null,
  byline text,
  published_at timestamptz,
  summary text,
  status pipeline_status not null default 'DETECTED',
  selection_score numeric,
  selection_rationale text,
  slot_date date,
  detected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references stories(id) on delete set null,
  slot_date date,
  headline text,
  deck text,
  summary_line text,            -- bolded one-line summary
  body_md text,
  opening_line text,            -- captured at publish for recent_digest
  closing_line text,
  sources_json jsonb default '[]'::jsonb,
  theorists_json jsonb default '[]'::jsonb,
  intervention_type text,
  topic_tags text[] default '{}',
  status pipeline_status not null default 'RESEARCHING',
  gate_report_json jsonb,
  regen_count int not null default 0,
  reading_time_min int,
  url_slug text unique,
  scheduled_for timestamptz,    -- 6:00 a.m. ET opening queue
  published_at timestamptz,
  is_reopening boolean not null default false,
  reopening_of uuid references articles(id),
  flagged_for_reopening boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  headline text, deck text, summary_line text, body_md text,
  note text,                    -- 'initial draft' | 'regeneration: <reason>' | 'manual edit'
  created_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles(id) on delete cascade,
  name text not null,
  role text,
  why_relevant text not null,
  email text,
  email_source_url text,
  email_confidence contact_email_status not null default 'MISSING',
  guess_opt_in boolean not null default false,   -- Wonwoo must opt in per GUESSED recipient
  x_handle text,
  suppressed boolean not null default false,
  suppression_reason text,
  rank int,
  created_at timestamptz not null default now()
);

create table outreach_emails (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  draft_text text not null,
  status outreach_status not null default 'DRAFTED',
  approved_at timestamptz,
  sent_at timestamptz,
  delivery_status text,
  replied_at timestamptz,
  reply_text text,
  created_at timestamptz not null default now()
);

create table suppression_list (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique,   -- email or x handle, lowercased
  reason text not null,              -- 'opted_out' | 'bounced' | 'contacted_recently' | 'manual'
  added_at timestamptz not null default now()
);

create table events (
  id bigint generated always as identity primary key,
  entity_type text not null,         -- 'story' | 'article' | 'contact' | 'outreach_email' | 'system'
  entity_id text,
  from_status text,
  to_status text,
  actor text not null,               -- 'system' | 'wonwoo' | model id
  payload jsonb,
  created_at timestamptz not null default now()
);

create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value) values
  ('models', '{"column":"claude-fable-5","utility":"claude-fable-5"}'),
  ('daily_email_cap', '30'),
  ('warmup_daily_cap', '10'),
  ('warmup_until', 'null');

-- recent_digest: last 10 published, injected into every generation call (spec 4.2)
create or replace view recent_digest as
  select headline, opening_line, closing_line, theorists_json, intervention_type, published_at
  from articles
  where status in ('PUBLISHED','OUTREACH_PENDING','OUTREACH_DRAFTED','OUTREACH_APPROVED','SENT','TRACKING')
    and is_reopening = false
  order by published_at desc
  limit 10;

create index idx_stories_status on stories(status);
create index idx_stories_detected on stories(detected_at desc);
create index idx_stories_cluster on stories(cluster_id);
create index idx_articles_status on articles(status);
create index idx_articles_slot on articles(slot_date desc);
create index idx_articles_slug on articles(url_slug);
create index idx_articles_published on articles(published_at desc);
create index idx_contacts_article on contacts(article_id);
create index idx_outreach_contact on outreach_emails(contact_id);
create index idx_events_entity on events(entity_type, entity_id);

-- updated_at triggers
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_stories_touch before update on stories for each row execute function touch_updated_at();
create trigger trg_articles_touch before update on articles for each row execute function touch_updated_at();

-- RLS: single admin (authenticated) has full access; anon may read published articles only.
alter table stories enable row level security;
alter table articles enable row level security;
alter table article_versions enable row level security;
alter table contacts enable row level security;
alter table outreach_emails enable row level security;
alter table suppression_list enable row level security;
alter table events enable row level security;
alter table app_settings enable row level security;

create policy admin_all_stories on stories for all to authenticated using (true) with check (true);
create policy admin_all_articles on articles for all to authenticated using (true) with check (true);
create policy admin_all_versions on article_versions for all to authenticated using (true) with check (true);
create policy admin_all_contacts on contacts for all to authenticated using (true) with check (true);
create policy admin_all_outreach on outreach_emails for all to authenticated using (true) with check (true);
create policy admin_all_suppression on suppression_list for all to authenticated using (true) with check (true);
create policy admin_all_events on events for all to authenticated using (true) with check (true);
create policy admin_all_settings on app_settings for all to authenticated using (true) with check (true);

create policy public_read_published on articles for select to anon
  using (status in ('PUBLISHED','OUTREACH_PENDING','OUTREACH_DRAFTED','OUTREACH_APPROVED','SENT','TRACKING'));

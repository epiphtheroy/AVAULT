# AVAULT

The personal studio of Wonwoo Yoon: three political-ethical verdicts on the day's biggest news, daily. One named author, AI-assisted and disclosed, human-approved at every gate.

Full specification: `docs/avault-master-spec-v1.md` (Master Spec v1.0).

## Stack

Next.js (App Router) · Supabase (Postgres + Auth) · Vercel (hosting + cron) · Anthropic Claude Fable 5.

## Architecture

- **Public site** `/` — today's three verdicts, The Vault archive (`/vault`), `/about`, `/methodology`, `/contact`, `/reopening`, `rss.xml`, `sitemap.xml`. SSR/ISR, NewsArticle JSON-LD with Person entity.
- **Admin** `/admin` — single-user (Supabase Auth, `ADMIN_EMAIL`): Pipeline board, Story Desk, Editor, Outreach Manager, Analytics.
- **Pipeline API** `/api/…` — `cron/detect` (RSS pull, every 2h 04–22 KST), `pipeline/select` (ranked shortlist), `pipeline/draft` (Fable 5 + web search + anti-repetition digest), `pipeline/gate` (automated checks), `pipeline/publish` (human gate), `cron/open-vault` (releases approved columns at the 6 a.m. ET opening).

**Human gates (spec §9.6):** `pipeline/publish` and any future send accept only the editor's session, never the cron secret. Auto-publish and auto-send paths do not exist.

## Setup

1. `npm install`
2. Create a Supabase project → run `supabase/migrations/0001_init.sql` in the SQL editor → create the single admin user (Auth → Users → Add user) with the email in `ADMIN_EMAIL`.
3. Copy `.env.example` → `.env.local`, fill values.
4. `npm run dev` → `http://localhost:3000/admin`.

## Deploy

Push to GitHub → import in Vercel → set env vars (all from `.env.example`) → deploy. `vercel.json` registers both crons; set `CRON_SECRET` so Vercel authenticates them. Note: the detect cron's multi-hour schedule requires a paid Vercel plan; on Hobby, use the Story Desk "Detect now" button.

## Daily operation

1. Morning: Story Desk → Detect now (or cron) → Run selection → review shortlist → Accept top 3 (or pick individually).
2. Each draft: Editor → read gate report → edit/regenerate (max 2) → **Approve & publish** or **Approve → 6 a.m. ET**.
3. After publish (Phase 2): Outreach → Identify targets → review each contact + draft → approve sends individually.

## Phases

- **Phase 1 (live):** publish loop, SEO foundations, editor, pipeline DETECTED→PUBLISHED.
- **Phase 2 (skeleton built):** outreach identify/draft work; sending returns 501 until `mail.avault…` subdomain (SPF/DKIM/DMARC) + transactional provider are configured. Caps: 30/day, warm-up ≤10/day, permanent suppression.
- **Phase 3 (skeleton built):** GSC metrics in Analytics, Reopening workflow (flag → draft retrospective), topic-tag internal linking (related articles live already).

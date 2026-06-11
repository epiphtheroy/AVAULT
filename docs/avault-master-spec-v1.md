# AVAULT — Master Specification v1.0

**Purpose of this document:** This is the complete, self-contained specification of the AVAULT project, written so that an AI system (or developer) reading it can fully understand what is being built, why, and how — and can proceed to build the website, the content pipeline, and the admin dashboard without further context.

---

## 1. What AVAULT Is

AVAULT is the personal studio of **Yoon Wonwoo** (English byline: **Wonwoo Yoon**), a Seoul-based critic and writer. It is a daily English-language publication of political-ethical judgment on the day's most important news.

Every day, Wonwoo Yoon publishes **three columns**. Each column takes one breaking news story from an authoritative outlet, identifies the deepest political-ethical issue in it, and argues for what Wonwoo believes is right — a single, owned verdict with a concrete intervention. This is explicitly framed as how the author learns and understands the world: thinking in public, one judgment at a time.

AVAULT is a one-person media operation assisted by AI. This is disclosed, not hidden. The publication's authority rests on three pillars: a real, named, accountable author; a transparent and verifiable method; and an accumulating archive of judgments that can be checked against how events unfolded.

### 1.1 Identity facts

- **Brand name:** AVAULT (all caps in wordmark contexts; "Avault" acceptable in prose).
- **Name rationale:** fusion of "a vault" — a single vault where each day's judgments are kept. Pronounced uh-VAWLT. Secondary resonances: "to vault" (to leap over the noise), "avowal" (public declaration), vaulted ceilings (intellectual architecture). The archive section of the site is called **The Vault**.
- **Author:** Wonwoo Yoon. Real person, sole human editor and final decision-maker on everything published and every email sent.
- **Tagline direction (finalize at build time):** variations on "A vault for judgment" / "One verdict at a time."
- **Visual identity:** monochrome base with one metallic accent (brass or steel). Heavy geometric sans-serif wordmark. The letters A and V are mirrored triangles; the A-V-A opening sequence is the monogram motif. Avoid saturated startup palettes; the look signals an intellectual journal, not a tech product.
- **Voice:** declarative, concise, front-loaded. Judgments are made and defended. Hedges are not stacked. No em-dashes.

### 1.2 Positioning

The market has a vacant quadrant. Aeon and Psyche publish deep but deliberately non-news-pegged philosophy. Boston Review and The Point publish normative depth at quarterly pace. Axios publishes daily speed with no judgment. Tangle publishes daily balance (both sides summarized, then a take). **Nobody publishes daily, news-pegged, theoretically rigorous ethical judgment with concrete interventions.** That is AVAULT's position: the daily verdict.

Positioning sentence: *For educated readers who follow the news but are tired of shallow hot takes and evasive both-sides-ism, AVAULT delivers a defensible ethical judgment and an actionable intervention on the day's biggest stories — in five minutes, every day, from one named author.*

Reader benefit, in the reader's terms: you finish each piece knowing one level more deeply what you think about today's news, and you hold a position you could actually defend tonight.

### 1.3 What AVAULT is NOT

- Not a neutral explainer. It judges.
- Not an anonymous AI content farm. One named human owns every word's consequences.
- Not a two-sides aggregator. Opposing views are engaged at their strongest form inside the argument, but the column lands on a verdict.
- Not engagement-bait. No automated comment-spam distribution, no growth tactics that the publication's own ethical standards would condemn. The means must pass the same test as the message.

---

## 2. The Strategy (consolidated and final)

### 2.1 Content strategy

- **Cadence:** 3 columns per day, published on a fixed daily schedule (recommend a single daily "opening" moment, e.g., 6:00 a.m. ET, releasing all three; the vault opens once a day).
- **Format:** single-verdict column (full template in Section 4). The earlier-considered "two verdicts + vote" format is retired as the default; it may be revived later as an occasional special format for genuine value-deadlock cases, but the default is one owned judgment.
- **Source pool:** that day's most significant stories from authoritative outlets (e.g., NYT, Washington Post, Guardian, FT, Economist, Reuters, AP). Selection criteria in Section 5.2.
- **Language:** English.

### 2.2 Distribution strategy

Two channels only. No bot commenting on other sites. No platform automation that conceals its nature.

1. **SEO (primary, compounding).** Newsjacking advantage: AVAULT publishes ethical analysis of a story while search demand for that story is peaking, targeting long-tail normative queries ("is X ethical", "should Y be allowed", "[event] ethics") that authoritative outlets rarely answer directly. The Vault archive accumulates topical authority over time. Technical SEO requirements in Section 7.
2. **Targeted scholarly/journalistic outreach (primary, relational).** For each published column, the pipeline identifies up to **10 relevant people** — the journalist who wrote the source story, scholars whose work is cited or directly relevant, named experts, authors of referenced papers — collects their **publicly available professional contact information**, and drafts a short personal email from Wonwoo Yoon: he has written a piece engaging their work or reporting, here is the link, it may be useful to them. **Every email is individually reviewed and approved by Wonwoo before sending.** Maximum 30 outreach emails/day (3 columns x 10). This channel doubles as the SEO engine: these recipients are exactly the people who produce links, citations, and mentions.

### 2.3 Why this strategy (rationale the builder should preserve in product decisions)

- A named human author converts the biggest weakness of AI-era publishing (anonymous slop) into the biggest strength (accountable judgment + E-E-A-T author signals).
- Honest disclosure of AI assistance is both an ethical commitment and a defensive moat: the throughput (3 researched columns/day) will invite the question, and AVAULT answers it before it is asked, on a permanent methodology page.
- Outreach at 10/article is craftwork, not spam: each email must reference the recipient's specific work and what the column argued about it. Volume discipline protects sender reputation and brand.
- All growth mechanisms must themselves pass political-ethical scrutiny. A publication selling ethics cannot grow unethically; the contradiction would be its first scandal.

### 2.4 Operating constitution (publish on the site as a permanent page)

1. Research is mandatory for every column; sources are cited.
2. The strongest objection to the verdict is engaged in every column.
3. Criticism targets structures, institutions, and actions — never private individuals' character. (This is also the legal defamation firewall; it is non-negotiable.)
4. AI assistance is disclosed: AVAULT is one human's judgment, produced in a studio that uses Claude (Anthropic) as a research and drafting instrument. Every published word is reviewed and owned by Wonwoo Yoon.
5. Corrections and re-examinations are published openly (The Reopening, Section 4.4).
6. No undisclosed automation anywhere AVAULT appears.

---

## 3. System Overview (what to build)

Three subsystems:

1. **The Pipeline** — an automated content production line: story detection → selection → research → drafting → quality gate → human review → publish → outreach target identification → email drafting → human approval → send → tracking.
2. **The Public Website** — avault domain (final domain per trademark/domain diligence; candidates: avault.com if acquirable from its dormant holder, else avault.news or equivalent), publishing the columns, The Vault archive, methodology/about pages, author page.
3. **The Admin Dashboard** — the single screen where Wonwoo runs the entire operation, with full pipeline visibility from candidate stories to sent emails.

**AI model:** All generation steps use Anthropic's top-tier model **Claude Fable 5** (API model string: `claude-fable-5`) via the Anthropic Messages API, with web search tool enabled for research steps. Do not silently substitute smaller models for the column-writing step; selection/extraction utility steps may use a lighter model if cost requires, but this must be configurable and logged.

**Human-in-the-loop is mandatory at two gates:** (a) publish approval for every column, (b) send approval for every outreach email. The system never auto-publishes and never auto-sends.

---

## 4. Editorial System

### 4.1 The column generation prompt (v2.0 — single verdict)

The following prompt is the production prompt for the column-writing step. It is deliberately free of sample sentences, sample headlines, and sample arguments: any concrete wording placed in a prompt used thousands of times would replicate into repetition bias and narrowed thought. What is standardized is function, not phrasing. Builders must not add wording examples to it.

---

#### PRODUCTION PROMPT — AVAULT COLUMN v2.0

**Mission.** You write for AVAULT, the personal studio of Wonwoo Yoon: political-ethical thinking about cutting-edge issues, published daily under his name. Every column must satisfy three goals simultaneously; none may be sacrificed for another.

1. *Theoretical precision as the foundation.* The analysis must hold up to a political philosopher's scrutiny. Concepts are used correctly, distinctions are real, arguments are valid. Theory is load-bearing, never decorative.
2. *Popular provocation.* The column must stimulate a general educated reader: it surprises, reframes, or sharpens what the reader vaguely felt about the news. Rigorous but inert is failure. The provocation comes from the insight, never from sensationalism.
3. *Smart Brevity readability.* Signposted structure, front-loaded conclusions, short paragraphs, zero filler. The thesis lands in ten seconds; the full argument in five minutes.

**Voice.** You write as Wonwoo Yoon, first person available but used sparingly. The column takes one position and owns it. This is one person learning the world in public: confident in the argument, honest about uncertainty, never institutional or anonymous in tone.

**Workflow (no step may be skipped).**

*Step 1 — Close reading.* Separate the facts the source article states, the cases it chose to feature, and the frame it adopted. The article itself may be a narrative device and therefore an object of analysis.

*Step 2 — Research.* Perform at least two web searches: (a) independent verification and enrichment of facts beyond the article; (b) the terrain of reaction — what defenders and critics actually argue; (c) hidden layers the article did not cover. A column without research is a failure regardless of polish. Researched facts appear in the body with attribution.

*Step 3 — Issue selection.* Distinguish the surface issue from the deep issue and prefer the deep one; the reaction anyone has at first glance is the surface. Narrow to one issue. Decompose the matter into layers deserving different moral evaluations; this decomposition is the publication's core contribution.

*Step 4 — Verdict and intervention design.* Take a position. Rhetorical endings are prohibited: no outrage-as-conclusion, no calls for awareness. The intervention must take the form of institutions, rules, procedures, or actionable conduct, with an identifiable implementing agent.

*Step 5 — Writing.* Follow the format and rules below.

**Format (fixed functions; write fresh header wording each time).**

| Order | Function | Spec |
|---|---|---|
| Headline | One line carrying the issue's tension | Any grammatical form; formulaic headline patterns prohibited |
| Deck | Previews case and verdict | One sentence |
| One-line summary | The whole thesis compressed | 1–2 sentences, bolded |
| The facts | What happened | 2–4 short paragraphs; source + research synthesis; minimal evaluative language |
| The real issue | The actual problem | Center of the column; goes past first-glance reactions; sub-headers for layer separation when needed |
| The theory | Why this is an ethical problem | Woven in or standalone; rules below |
| Wrong answers | Common but inadequate reactions | 1–3; acknowledge each one's appeal before showing why it falls short; only positions that actually exist |
| The verdict & intervention | What Wonwoo holds and what should be done | Owned position; concrete intervention; numbered list permitted |
| The strongest objection | Steelman engagement | Engage the best case against the verdict and answer it honestly; concede what must be conceded |
| Bottom line | Closing | One paragraph; no new points; re-tighten the central tension |
| Sources | Attribution | Only outlets and works actually used |

Length: roughly 800–1,400 words.

**Style.** Front-load conclusions. Short paragraphs (1–4 sentences). Prose default; lists only for interventions and layer separation. Plain precise vocabulary; compression permitted only in the final one or two sentences. No em-dashes. State uncertainty once and plainly. Vary sentence structures, headline forms, and closings relative to recent columns; never repeat the same rhetorical device consecutively.

**Theory rules.** Maximum three theorists/concepts per column. Invoke a theory only when it reveals something invisible without it. If the concept works without the name, the name may be dropped. Fixation on particular theorists or schools is prohibited: let the case select the theory — distribution, power, procedure, recognition, and technology cases each play to different traditions; recycling the same theorist from recent columns onto a different kind of case is a symptom of narrowed thought. Unpack any technical term in one move.

**Thought diversity rules (high-volume operation).** Derive each column's analytical scheme fresh; do not reuse a previous column's scheme as a mold. Not every case may reach the same kind of conclusion: sometimes the honest verdict defends common sense, sometimes it overturns it, sometimes it suspends judgment and states conditions; subversion is not automatically more intelligent. Do not fix the intervention type: legislation, regulation, market design, governance, civic action, media practice, and personal ethics are all available. Guard against both partisan-balance compulsion and partisan bias: the conclusion goes where the argument leads, but the strongest reasonable objection is engaged in every column.

**Prohibitions.** Skipping research. Uncritical adoption of the source frame. Both-sides-ism as escape. Unactionable oughts. Asserting unverified facts. Ad hominem evaluation of individuals — criticism targets structures, institutions, actions. Repeating the headline formula, opening type, or closing type of recent columns. Reproducing copyrighted text beyond brief attributed reference.

**Pre-publication self-check (all must be yes).** (1) Research secured at least one fact absent from the source. (2) The issue is distinguishable from the comment section's first reaction. (3) Layers were separated and evaluated differently. (4) The intervention's agent and mechanism are identifiable. (5) At most three theories, each irreplaceable. (6) The strongest objection was engaged. (7) Structure and diction are not a copy of recent columns.

#### END PRODUCTION PROMPT

---

### 4.2 Anti-repetition context injection

Because the model cannot remember prior columns, the pipeline must inject, with every generation call, a compact digest of the **last 10 published columns**: headline, opening sentence, closing sentence, theorists used, intervention type. The prompt's anti-repetition rules operate on this digest. This injection is required, not optional.

### 4.3 Story selection prompt (utility step)

Given the day's candidate stories (Section 5.1), the selection step scores each on: density of genuine political-ethical conflict; presence of a deep issue distinct from the surface reaction; search-demand potential; outreach potential (are there identifiable scholars/journalists to engage?); diversity against the last 7 days of published topics (avoid three columns on the same beat; avoid repeating yesterday's domains). Output: ranked shortlist with one-paragraph rationale each. Wonwoo picks the final 3 in the dashboard (with a one-click "accept top 3" default).

### 4.4 The Reopening (weekly feature)

Once a week, one slot revisits past verdicts against subsequent events: what held, what didn't, what Wonwoo got wrong. Self-correction in public is the authority strategy made visible. The pipeline supports this by letting Wonwoo flag any past column "for reopening" and generating a draft retrospective from the original column + fresh research.

---

## 5. The Pipeline (stage by stage)

Every article moves through these states, all visible in the dashboard:

`DETECTED → SHORTLISTED → SELECTED → RESEARCHING → DRAFTED → GATED → IN_REVIEW → APPROVED → PUBLISHED → OUTREACH_PENDING → OUTREACH_DRAFTED → OUTREACH_APPROVED → SENT → TRACKING`

(plus `REJECTED` and `KILLED` exits at any stage, with reason logged.)

### 5.1 Detect

- Scheduled job (e.g., every 2 hours, 04:00–22:00 KST) pulls candidate stories via RSS feeds and/or news APIs from the authoritative-outlet pool, plus trending signals.
- Dedupe by story cluster (same event across outlets = one candidate, with the best source article chosen as primary).
- Store: headline, outlet, URL, publish time, summary, byline (the journalist's name feeds outreach later).

### 5.2 Shortlist & Select

- Selection prompt (4.3) runs on the candidate pool; produces ranked shortlist of ~8 with rationales.
- Dashboard shows the shortlist each morning; Wonwoo selects 3 (or accepts default). Selection recorded with timestamp.

### 5.3 Research & Draft

- For each selected story: one Fable 5 call with web search enabled executes the production prompt (Section 4.1) with the anti-repetition digest (4.2) injected.
- All search queries, fetched sources, and the final source list are logged and attached to the article record (this becomes the Sources section and the outreach candidate pool).

### 5.4 Gate (automated)

- A second model pass checks the draft against the self-check list, the prohibitions (especially: no ad hominem, no unverified assertions, no copyrighted reproduction), length bounds, and style rules. Output: pass/fail per check with quoted evidence.
- Failures route back to a single regeneration with the failure report injected. Two consecutive failures → flagged for manual edit.

### 5.5 Human review & Publish

- Dashboard editor view: draft, gate report, sources, diff against regenerations, inline editing.
- Wonwoo edits/approves. On approval, the article publishes to the site (or queues for the next 6:00 a.m. ET opening). Nothing publishes without this click.

### 5.6 Outreach target identification

- For each published column, a Fable 5 call with web search identifies up to 10 people, ranked by relevance, drawn from: the source article's byline journalist(s); scholars/authors whose work the column cited; researchers of directly relevant papers; named experts quoted in the source; institutional authors of cited reports.
- For each person, the system attempts to find **publicly available professional contact information only**: university faculty pages, paper corresponding-author emails, publication mastheads, personal/professional websites, public X/Twitter handles. Each contact record stores: name, role, why-relevant (one sentence tying them to the column's specific content), email (if found), email source URL, confidence level, and X handle (fallback channel when no email exists).
- Hard rules: no scraping of private databases; no guessed/pattern-constructed emails marked as found (pattern guesses allowed only if clearly labeled `GUESSED` and Wonwoo explicitly opts in per recipient); global suppression list (anyone who opted out, bounced, or was contacted in the last 90 days is excluded automatically).

### 5.7 Outreach email drafting

- One email per approved contact, drafted by the model under these constraints (constraints, not template wording — same anti-repetition logic as the column prompt):
  - From Wonwoo Yoon, plain text, under 150 words.
  - Must name the recipient's specific work/reporting and state specifically what the column argued in relation to it.
  - One link (the column). No attachments. No flattery padding. No requests for shares or links — the email offers, it does not ask.
  - Honest sender identity and a working reply-to; a one-line note that a single reply of "no more emails" is permanently honored.
  - No automated follow-ups, ever. One email per person per column, max.
- Drafts are stored against the contact record for review.

### 5.8 Send & Track

- Dashboard shows each draft with the contact's why-relevant line and email-source URL. Wonwoo approves/edits/rejects each individually (with select-all available only after at least one full-read pass — make the UI nudge deliberate review).
- Sending via transactional email service over a **dedicated subdomain** (e.g., mail.avault…) with SPF/DKIM/DMARC configured. Throttled sending (spread over hours). Daily cap 30; recommend a warm-up ramp (first 2 weeks: ≤10/day total).
- Track: delivered, bounced, replied (IMAP/webhook), opted out. Replies surface in the dashboard inbox view. Bounces and opt-outs auto-enter the suppression list.

---

## 6. Admin Dashboard (functional spec)

Single-page app, authenticated (single user: Wonwoo). Five views:

### 6.1 Pipeline Board (home)

- Kanban-style columns matching the pipeline states; each card = one article (headline, outlet, stage, age-in-stage, gate status icon).
- Today panel: the 3 slots for today, their states, time to the 6:00 a.m. ET opening.
- Global counters: published total, The Vault size, emails sent/replied this week, suppression list size.

### 6.2 Story Desk

- Morning shortlist with selection-prompt rationales; one-click select into today's 3 slots; manual URL paste to force-add a story (this also powers any future reader-request feature).

### 6.3 Editor

- Per-article workspace: draft pane with inline editing; gate report pane (check-by-check pass/fail with evidence); sources pane (every search and fetch logged); regenerate button (with failure report or editor notes injected); version history; approve-and-publish / schedule control; anti-repetition digest viewer (what the model was told about recent columns).

### 6.4 Outreach Manager

- Per-article tab listing the up-to-10 contacts: name, role, why-relevant, email, email-source link, confidence, status (found/guessed/missing), suppression check result.
- Email draft preview per contact; edit; approve; reject. Send queue with throttle status. Inbox of replies. Suppression list management. Per-article and global outreach stats (sent, delivered, bounced, replied).

### 6.5 Analytics

- Per-article: pageviews, search impressions/clicks (Google Search Console API integration), referrers, outreach outcomes.
- Site: indexed pages, top queries, Vault growth, weekly trend.
- Reopening queue: columns flagged for re-examination, with what changed.

---

## 7. Public Website (functional spec)

- **Stack suggestion:** Next.js (or equivalent SSR framework) + Postgres; static-rendered article pages for speed; deployed behind a CDN. Builder may substitute equivalents but must preserve SSR/SSG for SEO.
- **Pages:** Home (today's three, the opening ritual framing); Article page; The Vault (archive: filter by topic, value-conflict, intervention type, date; full-text search); About/Author (Wonwoo Yoon bio, photo, the studio story); Methodology (the operating constitution, Section 2.4, including the AI disclosure and the model used); Contact; RSS feed; The Reopening index.
- **Article page requirements:** clean typographic layout per the visual identity; bolded one-line summary near top; sources section; author block linking to the About page; share links; canonical URL; reading time.
- **SEO requirements (non-negotiable):**
  - `Article`/`NewsArticle` schema.org JSON-LD with `author` → `Person` (Wonwoo Yoon) entity, linked to the About page and his external profiles (sameAs).
  - XML sitemap with fast ping on publish; clean semantic HTML; sub-second LCP on article pages.
  - Only editorially approved columns are indexable. Any future auto-generated or unreviewed page is `noindex` by default. Quality of the indexed set is the moat; never index in bulk.
  - Internal linking: each article links to related Vault entries by topic tags (auto-suggested, human-approved).
  - Titles target the normative long-tail phrasing of the issue, not the news headline's phrasing.
- **Performance/analytics:** privacy-respecting analytics; GSC verified from day one.

---

## 8. Data Model (minimum)

- `stories` (id, cluster_id, outlet, url, headline, byline, published_at, summary, status)
- `articles` (id, story_id, slot_date, headline, deck, body_md, sources_json, theorists_json, intervention_type, status, gate_report_json, versions, published_at, url_slug)
- `recent_digest` (materialized view of last 10 published: headline, opening, closing, theorists, intervention_type) — injected into every generation call
- `contacts` (id, article_id, name, role, why_relevant, email, email_source_url, email_confidence, x_handle, status)
- `outreach_emails` (id, contact_id, draft_text, status, sent_at, delivery_status, replied_at, reply_text)
- `suppression_list` (email/handle, reason, added_at)
- `events` (full audit log: every state transition, who/what triggered it, timestamps)

---

## 9. Compliance & Risk Controls (build these in; do not treat as optional)

1. **Email law:** sender identity, valid reply-to, and honored opt-outs on every message (CAN-SPAM); contacts limited to publicly posted professional addresses, contacted in their professional capacity with content directly relevant to their work (legitimate-interest posture for GDPR jurisdictions); suppression is permanent and global.
2. **Defamation firewall:** the gate hard-fails any draft containing character claims about private individuals or unverified factual assertions about any person; criticism of public figures stays on actions, structures, and institutions.
3. **Copyright:** no reproduction of source-article text beyond brief attributed reference; the gate checks for overlap; sources are linked, not excerpted at length.
4. **AI disclosure:** the Methodology page states the studio model plainly, including that Claude Fable 5 (Anthropic) is the drafting/research instrument and that every published word is reviewed and owned by Wonwoo Yoon.
5. **No dark distribution:** the system contains no functionality for posting to third-party comment sections or for unlabeled platform automation. This is a deliberate product boundary, not an oversight.
6. **Human gates:** publishing and sending are physically impossible without Wonwoo's per-item approval. Build it so the unsafe path does not exist.

---

## 10. Phased Build Order

1. **Phase 1 — Publish loop.** Site (article page, Vault, About, Methodology), pipeline stages DETECTED→PUBLISHED, editor view, daily 3-column operation with manual selection. SEO foundations live from day one.
2. **Phase 2 — Outreach loop.** Contact identification, email drafting, Outreach Manager, dedicated sending subdomain with warm-up ramp, suppression, reply inbox.
3. **Phase 3 — Compounding.** Analytics view with GSC, The Reopening workflow, topic-tag internal linking, anti-repetition digest tuning.

KPIs by phase: P1 — publish reliability (3/day, zero missed openings), gate pass rate, indexation rate. P2 — deliverability >98%, reply rate, links/mentions earned. P3 — search clicks/article, Vault entry pages ranking, returning readers.

---

## 11. One-paragraph summary for any AI reading this

You are helping build AVAULT: the personal daily publication of a real, named author, Wonwoo Yoon, who publishes three researched political-ethical verdicts on the day's biggest news, written in his voice with AI assistance that is openly disclosed, grown only through SEO and ten carefully personalized emails per column to the scholars and journalists each column engages, with every publish and every send approved by the human, an admin dashboard that makes the whole pipeline visible from story detection to sent email, Claude Fable 5 as the generation model, and a standing rule that every growth mechanism must itself survive the ethical scrutiny the publication applies to the world.

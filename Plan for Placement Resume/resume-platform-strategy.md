# Placement Resume Platform: Strategy Document

## The core idea

Your achievements get stored once, tagged by competency, and each resume variant is a weighted pull from that same bank. This is what lets you optimize resume count instead of building one document per function from scratch.

## Competency taxonomy (tags for every achievement)

Each piece of your content bank gets tagged with one or more of these. Aim to keep this list tight, five to seven tags, so it stays meaningful.

1. **Strategic problem-solving** — structuring ambiguous problems, frameworks, recommendations
2. **Product & technical execution** — building things, shipping features, technical depth
3. **Sustainability & impact framing** — ESG, sustainability consulting, social impact
4. **Financial & quantitative rigor** — modeling, analysis, numbers-driven work
5. **Leadership & stakeholder management** — managing people, driving initiatives, cross-functional work
6. **Entrepreneurial ownership** — founding, building 0-to-1, independent execution

### Draft tagging of what I know about your work so far

| Experience | Likely tags |
|---|---|
| Accenture Strategy Consulting internship | Strategic problem-solving, Stakeholder management |
| Edme (UI/UX & research, edtech) | Product execution, Strategic problem-solving |
| Hinduja Group sustainability internship | Sustainability & impact, Stakeholder management |
| losersmindset.com automation project | Product execution, Entrepreneurial ownership |
| Side projects (FitFrame, Plank-Pro, Opportunity OS, anniversary site) | Product execution, Entrepreneurial ownership |
| Sustainability Cell mentoring | Leadership, Sustainability & impact |
| ENT electives | Entrepreneurial ownership |

*(You'll refine these once you're actually writing bullets — this is just a starting pass.)*

## Resume variants

Based on what you described, two variants likely cover your range without diluting either:

**Variant A — Broad cross-functional** (consulting / PM / sustainability-adjacent)
Pulls heavily from: Strategic problem-solving, Product execution, Sustainability & impact
These three share enough underlying evidence (Accenture, Edme, Hinduja) to read as one coherent narrative.

**Variant B — Focused finance**
Pulls heavily from: Financial & quantitative rigor, with Strategic problem-solving as secondary support
Same underlying achievements may appear in both variants, but rephrased and re-weighted differently.

*Open question: does this 2-variant split match what you have in mind, or is there a third cut?*

## Integration decision: build inside InternPrep AI, not standalone

InternPrep AI already has a Resume Intelligence engine with the two most expensive pieces built: a Supabase pgvector store of embedded golden-example bullets, and bullet-level RAG matching against them. That engine was built for internship-tier critique (upload a finished resume, get scored/diffed against golden examples). What's missing is build mode: generating a first draft from raw, untagged achievements rather than critiquing an existing document. The plan below extends the existing engine on two new dimensions instead of duplicating it.

### Golden-example table: new tagging dimensions

The existing table tags by target role only, and only holds internship-tier examples. Add:
- `tier` — `internship` or `placement`. Existing data stays tagged `internship`; new senior resumes get tagged `placement`.
- `company` — nullable. Populated where available, used as a secondary match boost, not a dependency (auto-falls back to domain-level pool below a ~3-resume threshold per company).
- Competency tags (multi-tag, alongside the existing domain/role tag): Strategic problem-solving, Product & technical execution, Sustainability & impact, Financial & quantitative rigor, Leadership & stakeholder management, Entrepreneurial ownership.

With 10+ placement resumes per domain, domain-level RAG matching has a solid statistical base and is the primary match source. Company-level matching only kicks in when density supports it.

### The pipeline, mapped onto existing infrastructure

**1. Content bank (new table)** — user-scoped, holds raw achievement text, metrics, and competency tags. Nothing in the current platform stores unstructured personal achievements ahead of formatting, so this is genuinely new.

**2. Ingest placement resumes into the golden-example store (extends existing ingestion)** — same pipeline InternPrep AI already uses to embed golden examples, run against the new placement-tier batch, tagged `tier=placement`, `domain`, `company` (where dense enough), and competency tags. Priority order: ingest placement-tier first since that's what actually matters for this resume; internship-tier data remains as fallback only if a placement-tier match doesn't exist for a given domain/competency combination.

**3. Bullet generation (new endpoint on the existing FastAPI backend)** — given a content bank entry plus its tags, embed it, pull nearest neighbors from the golden-example store filtered by `tier=placement`, domain, and competency (company-boosted where dense), and pass those as few-shot examples to Gemini for structured bullet generation — same Gemini-for-JSON-schema pattern the platform already uses for critique reports. This replaces the static "pattern report" concept with live nearest-neighbor matching, which is more accurate and reuses existing infra directly.

**4. Resume variants and versions (new tables)** — bookkeeping for which content bank entries got accepted into which variant, at what weight, at what version.

**5. Resume assembler + PDF export (new, no existing analog)** — the one piece with no current equivalent in the platform. Renders accepted bullets into a clean template per variant. Keep simple — legibility over design.

## Data model additions (Supabase)

- `golden_examples` (existing table, extended) — add `tier`, `company` (nullable), `competency_tags[]`
- `content_bank` (new) — id, user_id, source, raw_text, metrics, competency_tags[], generated_bullets (jsonb)
- `resume_variants` (new) — id, user_id, name, included_tags[], weights (jsonb), status
- `resume_versions` (new) — variant_id, version_num, content_snapshot, created_at

## Stack

No change — this runs entirely on InternPrep AI's existing stack: Next.js 15 + Tailwind on Vercel, Supabase Postgres + pgvector, Gemini for structured generation, FastAPI on Render for the new endpoints.

## Build sequence, revised for integration

Net-new work is now four things: the tier/company/competency tag extension, the content bank table + input UI, the bullet generation endpoint, and the variant assembler + PDF export. Everything else (RAG matching, Gemini JSON pipeline, auth, hosting) is reused as-is.

| Phase | Build track | Your parallel track |
|---|---|---|
| 1 | Schema migration: add tier/company/competency fields to golden_examples; create content_bank, resume_variants, resume_versions tables | List every achievement; start tagging by competency |
| 2 | Ingest & tag placement resumes into golden_examples (tier=placement) | Continue tagging your content bank |
| 3 | Build bullet generation endpoint + accept/edit UI | Review generated bullets for accuracy against real examples |
| 4 | Build variant assembler + PDF export | Accept bullets into both variants, generate first drafts |
| 5–6 | — | Feedback rounds with seniors/mentors |
| 7–8+ | — | Polish, ATS formatting check, buffer |

## Open decisions before the PRD gets written

1. Confirm: two variants (broad cross-functional + focused finance), or a third cut?
2. Any specific placement cell formatting constraints (one-page limit, required sections)?
3. JD-paste support in v1, or a v2 addition once the core loop works?

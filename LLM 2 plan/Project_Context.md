# Project Context — AI Interview & Case Prep Assistant

Read this file fully before making any changes. This is the source of truth for scope, architecture, and conventions. If a request conflicts with this file, flag the conflict instead of silently deviating.

## What this is

A free, web-based interview prep tool for IITB second-years going through internship season. V1 focuses on consulting case interviews plus HR/resume/brainstormer question types, for a curated set of target companies (consulting, finance, product, supply chain, AI/DS). It is not a general-purpose "practice any interview" tool — depth on a narrow scope beats breadth.

## Hard constraints (do not violate these)

1. **Zero budget.** Every external service used must have a genuinely free tier at this project's scale. No paid voice APIs (ElevenLabs, OpenAI voice) in V1. No paid LLM APIs as the primary runtime model.
2. **Minimal data storage.** Store only: resume text, target companies, identified weak areas, and a small number of recent session summaries. Do not add analytics tracking, extensive logging of user behavior, or speculative fields "in case we need them later."
3. **No hire/no-hire verdicts** in feedback output. Feedback is dimension-based and constructive, framed as a readiness signal, not a pass/fail judgment.
4. **Progressive case disclosure is non-negotiable.** The AI interviewer must never dump the full case prompt with all data upfront. Data is revealed only in response to relevant candidate questions. This is the single most important realism feature of the product — do not simplify it away under time pressure.
5. **No dashes as bullet points or list separators anywhere in UI copy, feedback text, or generated content.** Use numbered lists or plain sentences instead.

## Tech stack (locked — do not substitute without discussion)

* Frontend: Next.js (App Router), deployed on Vercel free tier
* Backend/DB/Auth/Vector store: Supabase (Postgres + pgvector extension + Auth + Storage), free tier
* Conversational LLM (the interviewer): Groq API, Llama 3.3 70B (`llama-3.3-70b-versatile`) — chosen for low-latency real-time back-and-forth on the free tier
* Analysis/feedback LLM (heavier, fewer calls): Google Gemini API, `gemini-2.5-flash` — used for resume analysis, rubric scoring, and feedback generation
* Embeddings: Gemini embeddings (`gemini-embedding-001` or current equivalent — verify exact model name in Google's docs at build time, this changes) stored in Supabase pgvector
* Resume parsing: pdf-parse or pdfjs, self-hosted, no external API
* Voice: out of scope for V1. If added later, use the browser's native Web Speech API before considering any paid service.

Environment variables required (see `.env.example`):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
```

## Architecture decisions

### The AI interviewer is a state machine, not a single prompt

Every interview session moves through explicit phases: case intro, clarifying questions, structuring, analysis, synthesis (for case interviews); or opener, resume probing, deeper follow-up, wrap-up (for resume/HR interviews). The current phase and what has been revealed so far must be tracked in `interview_sessions.case_state` (JSON) and passed back into the LLM context on every turn. Do not rely on the LLM's own memory of the conversation to track what's been revealed — track it explicitly in structured state, and use the conversation history only for tone/context continuity.

### RAG retrieval is metadata-filtered, not blind semantic search

Every chunk in `kb_chunks` carries `company_id`, `round_type`, `interview_type`, and `difficulty` tags. Retrieval always filters by these tags first (based on the session's selected company/type), then does vector similarity search within that filtered set. Never do a raw similarity search across the entire knowledge base — it will surface irrelevant company or interview-type content.

### Resume intelligence runs once at upload, not per-turn

When a resume is uploaded, run a single analysis pass (Gemini) that: extracts bullets, flags vague or unsubstantiated claims, and generates likely follow-up questions per bullet. Store this as structured JSON on the `resumes` row. The interviewer references this stored analysis during the session rather than re-analyzing the resume on every turn.

### Feedback generation happens once, at session end

Do not generate incremental feedback mid-conversation. Run one feedback pass at the end using the full transcript plus the rubric dimensions defined below.

## Feedback rubric (fixed dimensions, do not add "confidence score" as a single number)

1. Structuring and MECE-ness
2. Business intuition
3. Quantitative reasoning
4. Communication clarity
5. Depth versus recitation
6. Resume grounding (resume-based questions only)
7. Handling of follow-ups and pressure

Output format: qualitative per-dimension notes plus 2-3 concrete "fix this next" points. No overall numeric score, no hire/no-hire label.

## Coding conventions

* TypeScript throughout, strict mode on
* Next.js App Router, server components by default, client components only where interactivity requires it
* Supabase client: use the server client in server components/route handlers, browser client only in client components
* Keep LLM prompt templates in dedicated files under `lib/prompts/`, not inlined in route handlers, so they're easy to iterate on without touching logic
* Every LLM call site should have a fallback/error path (rate limit hit, timeout) — free tiers will get rate limited, this is expected, not exceptional

## What NOT to build in V1 (do not add these unless explicitly asked)

1. Voice conversation
2. Analytics dashboard
3. Preparation roadmap / daily task generator
4. Community features (senior uploads, peer matching, forums)
5. Gamification beyond a simple readiness percentage
6. Multi-agent panel interviews
7. Coding round support

## Current company seed list

_To be filled in before RAG/company data work begins. See `BUILD_PROMPTS.md` phase 1._

## Definition of done for V1

A second-year can sign up, upload a resume, pick a target company and case interview mode, go through a full progressively-revealed case conversation with realistic cross-questioning, and receive rubric-based feedback at the end — all at zero running cost.

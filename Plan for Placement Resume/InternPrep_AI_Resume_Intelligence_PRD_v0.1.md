# InternPrep AI — Resume Intelligence
## Comprehensive Product Requirements Document (PRD)

**Document status:** Initial comprehensive draft  
**Version:** v0.1  
**Scope:** Resume Intelligence module within InternPrep AI  
**Primary market:** IIT placement and internship preparation

---

# 1. Executive Summary

InternPrep AI is an AI-powered preparation ecosystem designed to help students prepare for highly competitive internships and placements. Its existing platform combines Resume Intelligence, live mock interviews, domain/HR interviews, and progress tracking. The current Resume Intelligence engine already supports role-aware analysis, multimodal PDF extraction, bullet-level retrieval against successful resume examples, granular critique, visual diff suggestions, and an interactive workshop mode.

The next evolution of Resume Intelligence is **not a conventional resume builder**.

InternPrep AI should help a student answer:

> **Given everything I have actually done, what are the highest-impact points I should present, how should I present them for different roles, and how strong are they compared with successful candidates?**

The platform will therefore become a **resume-centric intelligence system** built around a structured Achievement Vault.

Core pipeline:

```text
User Context / Old Resumes / New Experiences / Documents
                         ↓
                AI Extraction
                         ↓
                Achievement Vault
                         ↓
             Role Intelligence Layer
                         ↓
          Achievement / Bullet Ranking
                         ↓
            Multiple Bullet Variants
                         ↓
          Resume Strategy & Benchmarking
                         ↓
          High-Impact Resume Point Bank
```

The platform will **not** attempt to replace conventional resume editors. Users should take the generated high-impact points and strategies and use them in their preferred resume template/editor.

---

# 2. Product Vision

## 2.1 Overall InternPrep AI Vision

> **Build the best preparation platform for any kind of internship or placement interview.**

Resume Intelligence is one major capability within that broader platform.

## 2.2 Resume Intelligence Vision

> **Build the most intelligent system for converting a student's real experiences into high-impact, role-specific resume points using a proprietary database of successful resumes and rigorous benchmarking.**

The system should be significantly more useful than generic LLM prompting because it combines:

1. The user's own career information.
2. Structured achievements.
3. Successful-resume intelligence.
4. Role-specific writing patterns.
5. Benchmarking.
6. Explainable recommendations.
7. Iterative user control.

---

# 3. Product Principles

## 3.1 Intelligence > Automation
Do not automate something merely because it can be automated.

## 3.2 Evidence Before Wording
Work from what the student actually did. Never invent achievements or unsupported metrics.

## 3.3 User Owns the Achievement Vault
Users can edit, correct, delete, and refine their information.

## 3.4 Suggestions Before Actions
AI recommends changes before applying them.

## 3.5 Multiple Options
Generate multiple viable bullet variants rather than claiming one universally perfect answer.

## 3.6 Role-Specific Intelligence
The same achievement can have different value and wording for Product, AI, Consulting, Sustainability, Finance, etc.

## 3.7 Benchmark Against Reality
Use successful-resume data whenever possible instead of relying only on generic advice.

## 3.8 Explain Recommendations
Users should understand why a point is strong or weak.

## 3.9 No Fake Precision
Benchmark scores are internal guidance, not predictions of hiring probability.

## 3.10 Resume-Centric Scope
Focus on producing excellent resume points and strategy. Do not become a general career-management suite.

---

# 4. Scope

## 4.1 In Scope

### User-side
- Achievement Vault
- Importing old resumes
- Importing notes and supporting documents
- AI achievement extraction
- User verification and editing
- Achievement tagging/classification
- Role-specific achievement analysis
- Multiple bullet generation
- Bullet ranking
- Resume strategy
- Role fit
- Impact analysis
- Leadership analysis
- Benchmark percentile
- Resume score
- Gap analysis
- Successful-resume benchmarking
- Resume review
- Point-bank management

### Platform-side
- Senior resume ingestion
- Resume parsing
- Bullet extraction
- Resume pattern mining
- Company/role metadata
- Anonymous benchmarking
- Resume DNA
- Retrieval/RAG
- Role-specific scoring
- Internal knowledge base
- Evaluation framework

## 4.2 Explicitly Out of Scope

Initial versions will NOT build:

- Drag-and-drop resume editor
- Canva-like resume designer
- Full PDF resume generation as the primary workflow
- Full job-description-to-resume generation
- Public browsing of senior resumes
- Dedicated company career intelligence pages
- LinkedIn generation
- Cover letters
- SOP generation
- Networking automation
- General career planning
- Independent Career OS

---

# 5. Target Users

## Primary User

Students preparing for competitive IIT internships and placements.

Initial target:
- IIT students
- Particularly students approaching internship/placement season
- Students applying to non-core and competitive roles

Current role priorities:

1. Product
2. AI
3. Consulting
4. Sustainability
5. Finance

The architecture should support additional roles later.

---

# 6. Core User Problem

Students often have more experience than can fit on a resume.

The difficult part is not merely writing English. The real problems are:

- Remembering everything they have done.
- Identifying what is actually impressive.
- Quantifying impact.
- Choosing which achievements matter for a role.
- Presenting the same achievement differently for different roles.
- Understanding what strong candidates emphasize.
- Knowing what their profile lacks.
- Getting high-quality feedback without depending on busy seniors.
- Converting raw experiences into concise, high-impact resume points.

InternPrep AI should solve these problems systematically.

---

# 7. Product Mental Model

The user should think:

> **A smart resume mentor that knows my achievements and understands what successful resumes look like.**

It should not feel like:

> A document editor that happens to have AI.

---

# 8. End-to-End User Journey

## Step 1 — Create/Update Resume Intelligence Profile

Users provide:
- Existing resume(s)
- Old resumes
- Notes
- Project descriptions
- Internship information
- Presentations
- Other relevant documents

## Step 2 — AI Extraction

AI identifies candidate achievements.

```text
Accenture Internship
    ↓
Achievement 1
Achievement 2
Achievement 3
Achievement 4
```

## Step 3 — Verification

Present:

```text
Found 12 achievements

✓ Keep
✏ Edit
✗ Reject
```

## Step 4 — Achievement Vault

Accepted achievements become structured records that users can edit later.

## Step 5 — Select Target Role

Examples:
- Product
- AI
- Consulting
- Sustainability
- Finance

Users may define priorities such as:

```text
Product > AI > Consulting
```

## Step 6 — Achievement Intelligence

Recommend:
- Strong achievements
- Less relevant achievements
- Missing metrics
- High-impact opportunities
- Profile gaps

## Step 7 — Generate Bullet Variants

For one achievement:

```text
Product-oriented
Consulting-oriented
AI-oriented
Impact-oriented
```

## Step 8 — Benchmark

Provide:
- Score
- Impact
- Role fit
- Leadership
- Benchmark percentile
- Strengths
- Weaknesses
- Improvement suggestions

## Step 9 — Resume Strategy

Recommend:
- Which achievements to prioritize.
- Which to deprioritize.
- How to write them for different roles.
- What the profile lacks.

## Step 10 — Export Point Bank

Final output is a high-quality set of resume points and strategy recommendations. The user puts these into their own resume template/editor.

---

# 9. Achievement Vault

## 9.1 Why Achievement Is the Core Entity

An internship/project is too broad. A resume needs individual accomplishments.

```text
Experience
    ↓
Multiple Achievements
    ↓
Multiple Bullet Variants
```

Achievements are reusable across roles.

Example:

```text
Accenture Internship
    ├── Achievement A
    ├── Achievement B
    ├── Achievement C
    └── Achievement D
```

---

# 10. Achievement Data Model

Conceptual fields:

### Identity
- Achievement ID
- Title
- Parent experience
- Organization
- Timeline

### Raw Information
- Original description
- User notes
- Extracted facts

### Impact
- Outcome
- Quantified metrics
- Scale
- Users
- Revenue/cost/time impact where applicable
- Business impact
- Technical impact

### Skills
- Technical skills
- Analytical skills
- Product skills
- Leadership
- Communication
- Ownership
- Strategy

### Classification
- Product relevance
- AI relevance
- Consulting relevance
- Sustainability relevance
- Finance relevance
- Other role tags

### Evidence
- Source document
- Source text
- Presentation
- Link
- Repository
- Other evidence

### AI Metadata
- Extraction confidence
- Classification confidence
- Suggested role fit
- Suggested impact strength
- Suggested leadership strength

### User Metadata
- User edits
- Accepted/rejected status
- Notes
- Tags

---

# 11. Achievement Editing

Users can:
- Edit title
- Edit description
- Correct facts
- Add metrics
- Add skills
- Add evidence
- Add tags
- Delete achievements
- Merge duplicates
- Split overly broad achievements

AI assists; the user remains the authority over factual information.

---

# 12. AI Extraction Pipeline

```text
Upload
   ↓
Document Parsing
   ↓
Text / Structure Extraction
   ↓
Semantic Chunking
   ↓
Achievement Candidate Extraction
   ↓
Fact Normalization
   ↓
Metric Extraction
   ↓
Skill Extraction
   ↓
Role Classification
   ↓
Duplicate Detection
   ↓
Confidence Scoring
   ↓
User Verification
   ↓
Achievement Vault
```

---

# 13. Evidence Traceability

Every generated resume point should ideally trace back to:

```text
Generated Bullet
      ↓
Achievement
      ↓
Structured Facts
      ↓
Source Evidence
```

This reduces hallucination risk and makes the system auditable.

---

# 14. Missing Metric Reconstruction

A core interaction should reconstruct missing quantitative impact.

Example:

```text
AI:
You mentioned that you improved the process.
How many users were affected?

User:
12 people.

AI:
How frequently was the process used?

User:
Weekly.

AI:
What changed after your solution?
```

The AI should ask targeted questions based on the achievement.

It should never fabricate numbers.

---

# 15. Resume Intelligence Engine

Inputs:

```text
User Achievements
+
Target Role
+
User Priorities
+
Successful Resume Corpus
+
Role-specific patterns
```

Outputs:

```text
Achievement Ranking
+
Bullet Variants
+
Role Fit
+
Impact
+
Leadership
+
Benchmark
+
Gaps
+
Recommendations
```

---

# 16. Role-Specific Intelligence

The same achievement can be presented differently.

### Product
Emphasize:
- User problem
- Ownership
- Product decisions
- Scale
- Metrics
- Experimentation
- Execution

### Consulting
Emphasize:
- Problem solving
- Business impact
- Leadership
- Stakeholder management
- Scale
- Quantification

### AI
Emphasize:
- Technical depth
- Models
- Systems
- Deployment
- Data
- Performance

### Finance
Emphasize:
- Analytical rigor
- Financial reasoning
- Quantitative impact
- Markets/data
- Decision making

### Sustainability
Emphasize:
- Environmental impact
- Scale
- Resource efficiency
- Sustainability outcomes
- Stakeholder impact

The achievement remains the same; its framing changes.

---

# 17. User Priority Model

Users can define role priorities.

Example:

```text
Primary: Product
Secondary: AI
Third: Consulting
```

This influences recommendations and ranking.

---

# 18. Achievement Ranking Engine

Each achievement receives role-specific relevance scores.

Example:

| Achievement | Product | AI | Consulting | Sustainability | Finance |
|---|---:|---:|---:|---:|---:|
| A | 96 | 72 | 88 | 61 | 55 |
| B | 91 | 98 | 74 | 40 | 63 |
| C | 65 | 41 | 94 | 97 | 52 |

Potential signals:
- Semantic similarity to successful examples
- Role-specific skill overlap
- Impact strength
- Leadership signal
- Quantification
- Ownership
- Technical depth
- User priority
- Historical feedback
- Benchmark patterns

Semantic similarity alone should not determine quality.

---

# 19. Bullet Laboratory

Purpose: convert one achievement into multiple strong resume points.

Input:
- Structured achievement
- Target role
- Optional emphasis

Output:
- Multiple variants

Variants may include:
- Role-specific
- Impact-heavy
- Leadership-heavy
- Technical-heavy
- Concise

Users can:
- Compare
- Select
- Edit
- Regenerate
- Save

---

# 20. Bullet Generation Principles

Generated bullets must:
- Remain factually grounded.
- Use strong but accurate verbs.
- Quantify impact when evidence exists.
- Preserve meaningful technical detail.
- Avoid unnecessary jargon.
- Avoid filler.
- Be concise.
- Match the selected role.
- Reflect successful-resume patterns without copying.

---

# 21. Bullet Scoring

Dimensions:
- Impact
- Quantification
- Ownership
- Leadership
- Clarity
- Action strength
- Role fit
- Technical depth
- Business relevance
- Differentiation

The most important dimensions should be surfaced in the UI.

---

# 22. Resume-Level Scoring

Important metrics:

### Resume Score
Overall quality.

### Impact
Strength of communicated outcomes.

### Leadership
Ownership and leadership signal.

### Role Fit
Alignment with selected role.

### Benchmark Percentile
Approximate position against relevant successful-resume cohort.

### Quantification
Consistency and quality of meaningful metrics.

### Section/Profile Balance
Coherence of the selected point set.

Metrics must be accompanied by explanations.

---

# 23. Benchmark Percentile

Example:

```text
Impact: 87th percentile
Leadership: 79th percentile
Quantification: 91st percentile
Role Fit: 84th percentile
```

These are internal benchmark metrics, not predictions of hiring probability.

---

# 24. Resume DNA

Internal profile dimensions may include:
- Leadership
- Ownership
- Business impact
- Technical depth
- Analytical ability
- Communication
- Quantification
- Innovation
- Product thinking
- Strategic thinking

This enables comparisons with successful-resume clusters.

---

# 25. Senior Resume Knowledge Hub

The platform will use the user's corpus of 50+ successful senior resumes across domains, including company-specific successful resumes.

Senior resumes remain private.

Users should NOT browse or download source resumes.

The system may use them internally for:
- Patterns
- Benchmarks
- Similarity
- Aggregate insights
- Derived examples where appropriate

---

# 26. Senior Resume Ingestion

```text
Senior Resume PDF
      ↓
Multimodal Parsing
      ↓
Resume Structure Extraction
      ↓
Bullet Extraction
      ↓
Company / Role Metadata
      ↓
Bullet Classification
      ↓
Pattern Extraction
      ↓
Embeddings
      ↓
Benchmark Database
```

Metadata:
- Target company
- Role
- Academic background
- Page count
- Sections
- Skills
- Projects
- Experience
- Leadership
- Bullet characteristics

---

# 27. Pattern Mining

Identify:
- Common action verbs
- Average bullet length
- Quantification frequency
- Leadership frequency
- Project frequency
- Skill frequency
- Section ordering
- Role-specific wording patterns

Patterns are evidence, not rigid rules.

---

# 28. Hidden Pattern Discovery

AI should periodically analyze the successful corpus.

Example:

```text
Among successful Product resumes:
- Strong ownership appears frequently.
- Quantified project impact is common.
- User/customer context appears more frequently
  than in consulting resumes.
```

Insights become role-specific strategy guidance.

---

# 29. Resume Blueprint

The system may provide role-specific strategy.

Example:

```text
Product Resume Strategy

High emphasis:
- Product ownership
- Metrics
- Projects
- Execution

Medium:
- Leadership
- Technical depth

Lower:
- Generic coursework
```

Exact percentages should only be used when supported by sufficient data.

---

# 30. Resume Strategy Recommendations

The platform should be able to say:
- Prioritize this achievement.
- Deprioritize this achievement.
- Rewrite this achievement for Product.
- This point duplicates another point.
- This profile lacks visible leadership.
- This profile has strong technical depth but weak business impact.
- This achievement needs quantification.
- This point is too generic.
- This point is strong but not relevant to the selected role.

All recommendations are suggestions first.

---

# 31. Gap Analysis

Example:

```text
Consulting Profile

Strong:
✓ Leadership
✓ Quantification
✓ Analytical ability

Weak:
△ Business impact
△ Stakeholder management
```

Or:

```text
Product Profile

Strong:
✓ Technical execution
✓ Projects

Weak:
△ User/customer orientation
△ Product ownership
```

Critically distinguish:
1. Missing from the user's actual experience.
2. Present in the user's experience but not represented in resume points.

---

# 32. Resume Review Mode

The existing Resume Intelligence engine remains important.

Existing capabilities include:
- PDF extraction
- Role-aware critique
- Bullet-level retrieval
- Weak verb detection
- Quantification analysis
- Structure analysis
- Visual diff
- Interactive workshop
- Radar scoring

The Achievement Vault and Bullet Laboratory should feed into this existing system.

---

# 33. Existing Resume Integration

### User with Existing Resume

```text
Upload Resume
→ Analyze
→ Extract achievements
→ Compare with Vault
→ Add missing achievements
→ Generate improved points
→ Benchmark
```

### User Without Resume

```text
Upload context/documents
→ Extract achievements
→ Verify
→ Build Vault
→ Generate points
```

---

# 34. Interactive Achievement Reconstruction

The existing workshop can evolve into an achievement reconstruction assistant.

Example:

```text
AI:
You said you "improved the process."
What exactly changed?

User:
Automated data collection.

AI:
How many people previously collected the data?

User:
12.

AI:
How frequently?

User:
Weekly.

AI:
What changed after automation?
```

The result becomes a richer achievement record.

---

# 35. Explainability

Every major recommendation should have a "Why?" interaction.

Example:

```text
Recommended for Product

Why?

+ Strong ownership
+ Quantified scale
+ Product decision
+ Similar patterns appear frequently
  in successful Product resumes
```

---

# 36. Resume Intelligence Graph

Potential future visualization:

```text
Achievement
   ↓
Skills
   ↓
Roles
   ↓
Bullet Variants
   ↓
Evidence
   ↓
Benchmark Patterns
```

Example:

```text
Accenture Internship

7 Achievements
24 Bullet Variants

Best Fit:
Product
Consulting
AI

Evidence:
PPT
Notes
Project Files

Signals:
Ownership
Technical
Business
```

This is initially a UX enhancement, not a mandatory backend abstraction.

---

# 37. User Interface Architecture

Keep the module simple.

Suggested navigation:

```text
Resume Intelligence

├── My Achievements
├── Generate Points
├── Resume Strategy
├── Analyze Resume
└── Insights
```

Avoid exposing internal technical complexity.

---

# 38. My Achievements

Capabilities:
- Search
- Filter
- Edit
- Add
- Delete
- Merge
- Tag
- View evidence
- Generate bullets

Filters:
- Experience
- Role
- Skill
- Timeline
- Strength
- Used/not used

---

# 39. Generate Points

```text
Choose Achievement
        ↓
Choose Target Role
        ↓
Choose emphasis
        ↓
Generate variants
        ↓
Rank variants
        ↓
Review benchmark
        ↓
Save selected points
```

---

# 40. Resume Strategy Page

Inputs:
- Target role
- User priorities
- Selected achievements

Outputs:
- Recommended achievements
- Deprioritized achievements
- Role-specific writing guidance
- Profile strengths
- Profile gaps
- Benchmark comparison

---

# 41. Analyze Resume Page

```text
Analyze Resume
     ↓
Extract Achievements
     ↓
Compare With Existing Vault
     ↓
Detect New Information
     ↓
Suggest Updates
```

---

# 42. Insights Page

Priority metrics:

1. Resume Score
2. Role Fit
3. Impact
4. Leadership
5. Benchmark Percentile
6. Quantification
7. Profile Gaps
8. Technical Depth
9. Business Relevance

---

# 43. User Controls

Users can:
- Accept
- Reject
- Edit
- Regenerate
- Compare
- Save
- Undo

AI must never silently:
- Delete achievements
- Change factual metrics
- Add unsupported claims
- Replace chosen bullets

---

# 44. Data Model

Conceptual model:

```text
User
  │
  ├── Achievement
  │      ├── Evidence
  │      ├── Metrics
  │      ├── Skills
  │      └── Generated Bullets
  │
  ├── Resume Analysis
  │
  └── Resume Preferences

Senior Resume
  ├── Senior Bullet
  ├── Company
  ├── Role
  └── Pattern Metadata

Role
  ├── Role Signals
  └── Benchmark Data

Generated Bullet
  ├── Achievement
  ├── Role
  ├── Version
  ├── Scores
  └── Benchmark References
```

---

# 45. Suggested Database Tables

Existing foundation: Supabase/PostgreSQL + pgvector.

Conceptual new tables:
- achievements
- achievement_evidence
- achievement_metrics
- achievement_skills
- achievement_tags
- generated_bullets
- bullet_scores
- bullet_versions
- user_role_preferences
- resume_strategies
- resume_profile_scores
- senior_resumes
- senior_bullets
- senior_resume_patterns
- role_definitions
- role_benchmarks
- benchmark_clusters
- resume_analysis_sessions
- extraction_sessions
- extraction_candidates
- feedback_events

Exact schema should be finalized during technical design.

---

# 46. Vector Database Strategy

Use pgvector for semantic retrieval.

Potential collections:
- Senior bullets
- Achievements
- Role knowledge
- Generated bullets

Retrieve with metadata filters:
- Role
- Company where appropriate
- Section
- Experience type

Semantic similarity alone should never determine quality.

---

# 47. RAG Architecture

```text
User Achievement
       ↓
Role Filter
       ↓
Metadata Filter
       ↓
Vector Retrieval
       ↓
Successful Examples
       ↓
Pattern Extraction
       ↓
LLM Generation
       ↓
Rule / Score Validation
       ↓
Multiple Variants
       ↓
Ranking
```

The system should retrieve patterns and evidence rather than copy individual bullets.

---

# 48. AI Model Responsibilities

The current platform uses:
- Gemini for heavy cognitive tasks and structured parsing.
- Cerebras for low-latency conversational interviews.

For Resume Intelligence:

### Heavy LLM
Use for:
- Document understanding
- Structured extraction
- Achievement reconstruction
- Bullet generation
- Strategic analysis
- Resume review

### Embedding Model
Use for:
- Semantic retrieval
- Similarity
- Clustering
- Duplicate detection

### Fast LLM
Use for:
- Interactive metric reconstruction
- Workshop conversations
- Quick refinements

Model assignments should remain configurable.

---

# 49. Prompt Architecture

Modular prompt families:

- `extract_achievements`
- `normalize_achievement`
- `extract_metrics`
- `reconstruct_achievement`
- `classify_role_fit`
- `generate_bullets`
- `rank_bullets`
- `explain_bullet`
- `analyze_profile`
- `generate_strategy`
- `identify_gaps`
- `analyze_resume`
- `discover_patterns`

Prompts should receive structured context whenever possible.

---

# 50. Hallucination Prevention

Enforce:

### Source grounding
Claims must trace to user information.

### Metric grounding
Numbers originate from evidence or explicit user input.

### No invented achievements
AI cannot create accomplishments.

### Confidence scoring
Low-confidence extraction is surfaced for verification.

### Evidence links
Important claims should expose their source where possible.

---

# 51. Quality Evaluation

Evaluate generated points on:
- Factuality
- Impact
- Clarity
- Conciseness
- Quantification
- Ownership
- Role fit
- Leadership
- Technical depth
- Business relevance
- Differentiation

Use:
- Deterministic checks
- LLM-as-judge
- Retrieval similarity
- Human evaluation during development

---

# 52. Benchmarking Methodology

Benchmark against relevant cohorts.

Example:

```text
Target Role = Product
Target Company = X
Relevant successful resumes = N
```

Avoid inappropriate comparisons.

If sample size is small, communicate the limitation.

---

# 53. Privacy

Senior resumes remain private.

Users cannot browse or download source resumes.

Allowed outputs:
- Aggregate patterns
- Anonymous benchmark information
- Derived insights

User career data must be isolated by account.

---

# 54. Security

Requirements:
- Supabase Row Level Security
- User-scoped records
- Secure document storage
- Restricted benchmark access
- Audit trail for sensitive operations
- No cross-user leakage
- Secure API authentication
- Server-side authorization

---

# 55. Existing Technical Architecture

Current platform:

```text
Next.js 15
      ↓
FastAPI
      ↓
Supabase / PostgreSQL / pgvector
      ↓
Gemini + Cerebras
```

The Resume Intelligence extension should preserve this foundation and add modular services rather than creating a separate application.

---

# 56. Modular Backend Architecture

Suggested modules:

```text
backend/
├── resume_analysis/
├── achievement_engine/
├── extraction/
├── bullet_engine/
├── benchmark_engine/
├── role_engine/
├── strategy_engine/
├── knowledge_base/
├── scoring/
└── feedback/
```

Each module should have clear boundaries.

---

# 57. API Design

Conceptual endpoints:

```text
POST /resume/import
POST /resume/analyze

POST /achievements/extract
GET  /achievements
POST /achievements
PATCH /achievements/{id}
DELETE /achievements/{id}

POST /achievements/{id}/generate-bullets
POST /bullets/{id}/rank
POST /bullets/{id}/analyze

POST /resume/strategy
POST /resume/benchmark
POST /resume/gap-analysis

GET /roles
GET /insights
```

Exact contracts follow database design.

---

# 58. Existing Resume Analysis Integration

The existing engine should be reused.

Current capabilities:
- Role-aware benchmarking
- Multimodal extraction
- Bullet-level retrieval
- Weak verb detection
- Quantification analysis
- Structure analysis
- Visual diff
- Interactive workshop
- Radar scoring

New system extends these capabilities rather than rebuilding them.

---

# 59. Integration With Interview Platform

Resume Intelligence remains a separate module but can share:
- User identity
- Role taxonomy
- User preferences
- Dashboard
- AI infrastructure

Verified achievements may eventually improve behavioral/domain interview preparation.

This integration should not expand the initial resume scope.

---

# 60. Analytics

## Engagement
- Achievements created
- Achievements edited
- Bullets generated
- Bullets accepted
- Bullets rejected
- Regeneration rate

## Quality
- Average bullet score
- Average role-fit score
- Benchmark improvement
- User edits after generation

## Workflow
- Time to first useful bullet
- Achievements per user
- Variants per achievement
- Completion rate

## Learning
- Accepted recommendations
- Rejected recommendations
- Preferred bullet variants

---

# 61. Feedback Loop

Example:

```text
AI generated 5 bullets

User:
Accepted #3
Edited #2
Rejected #1,#4,#5
```

This creates preference signals that can improve future ranking.

---

# 62. UX Rule

The user should not need to understand:
- Embeddings
- pgvector
- RAG
- Benchmark clusters
- Model selection

The interface should expose conclusions and reasoning, not infrastructure.

---

# 63. Recommended Information Architecture

```text
InternPrep AI
│
├── Interviews
│   ├── Case Interviews
│   ├── Domain Interviews
│   └── HR / Behavioral
│
└── Resume Intelligence
    │
    ├── My Achievements
    ├── Generate Points
    ├── Resume Strategy
    ├── Analyze Resume
    └── Insights
```

---

# 64. Phase-Wise Roadmap

## Phase 0 — Product Foundation
- Final PRD
- Role taxonomy
- Achievement schema
- Senior corpus structure
- Evaluation criteria
- UI architecture

## Phase 1 — Achievement Vault
- Import old resume
- Extract achievements
- Verification
- Manual editing
- Storage
- Evidence linking
- Basic role tagging

**Success criterion:** A student can turn an old resume/context into a reliable structured achievement database.

## Phase 2 — Bullet Laboratory
- Role selection
- Multiple bullet generation
- Role-specific variants
- Ranking
- Explanation
- Save points
- Metric reconstruction

**Success criterion:** Any achievement can produce several strong role-specific points.

## Phase 3 — Senior Resume Intelligence
- Senior ingestion
- Bullet extraction
- Metadata
- Embeddings
- Retrieval
- Pattern mining
- Benchmarking

**Success criterion:** Generated points are grounded in successful-resume patterns.

## Phase 4 — Resume Strategy & Benchmarking
- Resume Score
- Role Fit
- Impact
- Leadership
- Benchmark percentile
- Gap analysis
- Achievement ranking
- Resume Blueprint

**Success criterion:** The platform tells students what to emphasize and why.

## Phase 5 — Existing Resume Integration
Unify:
- Resume analysis
- Achievement Vault
- Bullet Laboratory
- Benchmarking

**Success criterion:** Resume analysis becomes a continuous intelligence workflow.

## Phase 6 — Feedback & Optimization
- User feedback signals
- Recommendation learning
- Better ranking
- Better benchmark cohorts
- Analytics

**Success criterion:** The system improves through real usage.

---

# 65. MVP

Recommended first MVP:

```text
1. Resume/document import
2. Achievement extraction
3. Achievement verification
4. Achievement Vault
5. Role selection
6. Multiple bullet generation
7. Role-specific variants
8. Bullet scoring
9. Basic successful-resume retrieval
10. Explanation
11. Save/export point bank
```

Do NOT initially build:
- Resume editor
- Company pages
- Full resume generator
- Complex graph
- Advanced personalization
- Broad career tools

---

# 66. Core Product Loop

```text
Upload Context
      ↓
Extract Achievement
      ↓
Verify
      ↓
Choose Role
      ↓
Generate 5–8 Points
      ↓
Compare
      ↓
Understand Why
      ↓
Select
      ↓
Benchmark
      ↓
Improve
```

If this loop is excellent, the product has real value.

---

# 67. Success Metrics

## Activation
Percentage of users who create their first verified achievement.

## Time to Value
Time from upload to first useful resume point.

## Point Acceptance Rate
Generated points accepted or lightly edited.

## Achievement Coverage
Percentage of meaningful experiences represented.

## Benchmark Improvement
Change after point improvement.

## Repeat Usage
Users returning for additional roles.

---

# 68. Product Success Definition

The module succeeds if a student can say:

> **"I uploaded my old resume and context, and InternPrep AI helped me discover what I have actually accomplished, identify what matters for my target role, generate significantly better resume points, and understand why those points are strong."**

That is more important than generating a beautiful PDF.

---

# 69. Design Philosophy

The module should feel:
- Premium
- Intelligent
- Focused
- Evidence-based
- Fast
- Explainable
- Non-generic

Avoid:
- Excessive dashboards
- Artificially complex scoring
- Generic AI language
- Over-automation
- Resume-editor clutter

---

# 70. Future Improvements

After the core system is proven:
- More role categories
- More benchmark corpora
- Better company-specific benchmarking where data supports it
- Better achievement graphs
- Better personalized ranking
- Better evidence extraction
- Advanced longitudinal profile analysis
- Integration with interview preparation using verified achievements

These remain secondary.

---

# 71. Open Decisions

Keep these explicitly open until prototype/data validation:

1. Exact achievement schema.
2. Exact scoring formulas.
3. Benchmark percentile methodology.
4. Minimum corpus size for company-specific insights.
5. Exact role taxonomy.
6. Best embedding model.
7. Exact LLM allocation.
8. Exact evidence-linking workflow.
9. Resume Blueprint methodology.
10. Resume Intelligence Graph UI.
11. Pricing/monetization.
12. Which derived senior-resume insights should be surfaced.

---

# 72. Recommended Development Order

```text
Product Principles
        ↓
Achievement Schema
        ↓
Data Ingestion
        ↓
Achievement Vault
        ↓
Bullet Generation
        ↓
Role Intelligence
        ↓
Senior Resume Corpus
        ↓
Benchmarking
        ↓
Resume Strategy
        ↓
Existing Resume Analysis Integration
        ↓
Feedback Loop
        ↓
Optimization
```

Do not start with complex dashboards.

---

# 73. Final Product Architecture

```text
                 ┌──────────────────────────┐
                 │      User Context        │
                 │ Resumes / Notes / Docs   │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │    Extraction Engine     │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │     Achievement Vault    │
                 │  User-controlled source  │
                 │       of truth           │
                 └────────────┬─────────────┘
                              ↓
           ┌──────────────────┴──────────────────┐
           ↓                                     ↓
┌──────────────────────┐              ┌──────────────────────┐
│   Role Intelligence  │              │ Senior Resume Corpus │
│ Product/AI/Consult/  │              │ Successful resumes  │
│ Sustainability/Finance│             │ + patterns + vectors │
└──────────┬───────────┘              └──────────┬───────────┘
           └──────────────────┬──────────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │  Resume Intelligence     │
                 │  Ranking + Benchmarking   │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │    Bullet Laboratory     │
                 │ Multiple role-specific   │
                 │        variants          │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │ Resume Strategy & Review │
                 │ Score / Impact / Role Fit│
                 │ Leadership / Percentile  │
                 │ Gaps / Recommendations   │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │    High-Impact Points    │
                 │   User's final output    │
                 └──────────────────────────┘
```

---

# 74. Final Product Positioning

InternPrep AI should not primarily compete on:

> "We can write your resume with AI."

A stronger positioning is:

> **"InternPrep AI understands what you've actually accomplished, understands what successful candidates present, and helps you turn your experiences into the strongest possible resume points for your target role."**

The moat is:

```text
User Achievement Data
+
Successful Resume Intelligence
+
Role-Specific Knowledge
+
Benchmarking
+
Explainable AI
+
Continuous Feedback
```

---

# Appendix A — Existing InternPrep AI Context

The current platform already has:
- Resume Intelligence
- Live consulting case simulation
- Domain and HR interviews
- User dashboard/history
- Role-aware resume analysis
- Multimodal PDF extraction
- Bullet-level RAG against successful examples
- Granular bullet critique
- Visual diff suggestions
- Interactive workshop mode
- Radar scorecards

Current technical foundation:
- Next.js 15 / React
- Tailwind CSS
- Vercel
- FastAPI
- Render
- Supabase/PostgreSQL
- pgvector
- Gemini
- Cerebras

The new system should extend this foundation rather than create a separate application.

---

# Appendix B — Founder Decisions Captured

The following decisions are based on product-owner input:

- Overall InternPrep AI vision = best preparation platform for internships and placements.
- Initial audience = IIT placement ecosystem.
- Role priorities = Product, AI, Consulting, Sustainability, Finance.
- Resume output = high-impact points and strategy, not full resume documents.
- Users generate from their Achievement Vault.
- Existing resumes and context can populate the Vault.
- Achievement is the smallest unit.
- Users can edit their Vault.
- Senior resumes remain private.
- AI should provide explanations.
- AI should generate multiple options.
- AI editing should be moderate.
- AI should suggest before applying changes.
- AI should reconstruct missing achievement information interactively.
- No full resume editor.
- No company intelligence pages as a core feature.
- No JD-driven full-resume generation.
- Important metrics include Resume Score, Impact, Leadership, Role Fit, and Benchmark Percentile.
- User writing-style personalization is not a priority.
- Users can define role priorities.
- Resume Intelligence remains resume-centric.
- Architecture should be modular.
- Development should be phasewise.
- End-user experience takes priority in trade-offs.

---

# Appendix C — Immediate Next Steps

Before implementation:

1. Finalize the Achievement schema.
2. Gather and organize the 50+ senior resumes.
3. Gather old resumes and career material.
4. Define the initial role taxonomy.
5. Define the first benchmark cohort structure.
6. Prototype achievement extraction on a small dataset.
7. Manually evaluate extraction quality.
8. Prototype bullet generation.
9. Compare generated points against successful senior bullets.
10. Finalize scoring/evaluation methodology.
11. Design the first user-facing workflow.
12. Build Phase 1 only after extraction and achievement models are validated.

The first technical milestone should be a working:

**Achievement Extraction → Verification → Vault → Bullet Generation**

loop—not a large dashboard.

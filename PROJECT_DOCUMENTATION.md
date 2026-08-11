# InternPrep AI: Technical Architecture & Project Documentation

## 1. Executive Summary
**InternPrep AI** is an intelligent, highly specialized career preparation ecosystem designed to help top-tier university students (such as those at IIT Bombay) crack highly competitive "Day 1" internships and placements. Focusing heavily on non-core roles—Management Consulting, Finance, Product Management, and Data Science—the platform acts as an elite, on-demand AI mentor. It provides rigorous resume reviews, adaptive RAG-based bullet generation, and low-latency live mock interviews that simulate real MBB (McKinsey, BCG, Bain) partners.

---

## 2. Core Features & Capabilities

### A. Resume Intelligence & Section Composer
- **Multimodal Text Extraction:** Uses Vision AI (and PyMuPDF) to accurately extract text and hierarchy from heavily formatted, image-based, or exported PDF resumes.
- **Achievement Vault:** Raw user experiences and notes are intelligently merged into a "Vault" of structured achievements.
- **Section Composer:** Instead of simple grammar checks, the AI aggregates related achievements and drafts tailored, high-impact resume bullets based on a Golden Benchmark database.
- **Granular AI Critique:** Evaluates each bullet for weak action verbs (suggesting strong alternatives like "Spearheaded", "Engineered"), checks for quantification, and ensures adherence to the strict *Action + Context + Result (Impact)* format.

### B. Point Bank & Refinement Coach
- **Dual Storage System:** Separates raw user achievements (Vault) from curated, role-specific bullets (Point Bank).
- **Iterative AI Coach:** Users can click "Refine with AI" on any generated point to open a continuous chat window. This allows them to iteratively prompt the AI (e.g., "Make it shorter", "Focus on leadership") to dial in the perfect bullet, preserving context history seamlessly.

### C. Live Mock Case Interviews
- **Phase-Aware Architecture:** A multi-phase conversational AI that guides users through the four distinct phases of a consulting interview: Prompt/Clarification, Structuring (MECE frameworks), Analysis/Computation, and Synthesis.
- **Strict Interviewer Persona:** Simulates a real MBB Partner who pushes back on illogical frameworks and forces the user to drive the case forward without giving away the answer.
- **Split-Screen Scratchpad:** A side-by-side text scratchpad for users to jot down calculations and frameworks while maintaining eye contact with the chat interface.

### D. RAG Company Intelligence
- Contextual agent memory loaded via static markdown files and vector embeddings to simulate company-specific intelligence (e.g., FMCG vs. Finance expectations).

---

## 3. Technical Architecture

### Frontend (Web)
- **Framework:** Next.js 16 (App Router), React 19.
- **Styling & UI:** Tailwind CSS, Framer Motion, shadcn/ui, Radix UI primitives. Built with a modern, premium "glassmorphism" aesthetic with full Dark/Light mode support.
- **State Management:** Zustand for global state, React Context, and LocalForage (IndexedDB) for local zero-friction guest caching.
- **Hosting:** Vercel.

### Backend (API)
- **Framework:** Python FastAPI, providing high concurrency and fast asynchronous endpoints.
- **Database:** Supabase (PostgreSQL with `pgvector` for semantic search and embeddings).
- **ORM & Migrations:** SQLAlchemy and Alembic.
- **Observability:** Sentry for error tracking, PostHog for product analytics.
- **Hosting:** Render (or equivalent containerized environment), designed with a silent background ping mechanism from the frontend to eliminate cold-start delays.

---

## 4. AI & ML Stack

To balance deep reasoning with conversational speed, the platform utilizes a hybrid AI engine:

- **Heavy Cognitive Tasks:** Google Gemini (1.5 Pro/Flash). Used for structural PDF parsing, complex JSON schema generation, and compiling comprehensive resume critique reports. Gemini excels at massive context windows and strict schema adherence.
- **Live Chat Mock Interviews:** Cerebras (Llama 3.1 70B). Used exclusively for live chat mock interviews. Running on highly specialized hardware, Cerebras generates text at mind-bending speeds (~1000 tokens per second). This guarantees the AI interviewer responds instantly, preserving the natural high-pressure flow of a real conversation.
- **Embeddings & RAG:** `sentence-transformers` for creating mathematical vectors of resumes and golden examples, stored in Supabase `pgvector`. This powers the Adaptive RAG engine, mapping user inputs to the most similar successful past resumes.

---

## 5. Key Design Decisions & Tradeoffs

1. **Cerebras vs. OpenAI for Live Interviews:**
   - *Tradeoff:* While Cerebras (Llama 3.1 70B) might trail slightly behind GPT-4o in sheer multi-step reasoning, its *latency* advantage is massive. Real case interviews require immediate pushback; waiting 5-10 seconds for a GPT-4 response ruins the immersion. Cerebras was chosen to prioritize flow, speed, and pressure.
2. **Dual Storage System (Guest Mode vs Auth):**
   - *Decision:* Provide a zero-friction IndexedDB guest mode for immediate utility, allowing students to test the platform instantly. An optional Supabase sync is provided for cross-device tracking, reducing bounce rate while managing database costs.
3. **Resilient Load Balancing & Error Handling:**
   - *Decision:* The FastAPI backend implements exponential backoff (via `tenacity`) and fallback models. If a rate limit is hit or a model goes offline, the system seamlessly intercepts the error and retries the request without dropping the user's connection.
4. **Adaptive UI Design (Mobile vs Desktop):**
   - *Decision:* Desktop features split-screen "Scratchpad" layouts for complex cases, while the mobile UI gracefully degrades into collapsible hamburger menus and stacked vertical cards. Hover states (which fail on touchscreens) are explicitly supplemented by persistent action buttons on mobile (e.g., in the Point Bank) to ensure full accessibility.
5. **No Raw Copy-Pasting in Resume Generation:**
   - *Decision:* The `achievement_engine` explicitly forbids the AI from blindly copy-pasting substrings from the user's raw notes. It forces the AI to reconstruct fragments into grammatically perfect, standalone bullets, stripping out first-person pronouns ("I", "my") and strictly enforcing a professional resume tone.

---

## 6. Project Structure Overview

```text
internprep-ai/
├── apps/
│   ├── api/                  # Python FastAPI Backend
│   │   ├── agents/           # LLM orchestration, Cerebras integration, Achievement Engine
│   │   ├── routers/          # REST API endpoints (resume_builder, interviews, etc.)
│   │   ├── services/         # Database, Embeddings, integrations
│   │   ├── schema.sql        # Database schema definitions
│   │   ├── main.py           # Application entry point
│   │   └── requirements.txt  # Python dependencies
│   └── web/                  # Next.js 16 Frontend
│       ├── src/
│       │   ├── app/          # App Router pages (dashboard, resume-builder, interview)
│       │   ├── components/   # Reusable UI components (shadcn, framer-motion)
│       │   └── lib/          # Utilities and state management (Zustand)
│       └── package.json      # Node dependencies
├── data/                     # Static RAG data, Casebooks
├── PLATFORM_OVERVIEW.md      # Initial high-level platform summary
├── PROJECT_DOCUMENTATION.md  # This comprehensive technical document
└── (various planning files)  # Implementation plans, PRDs
```

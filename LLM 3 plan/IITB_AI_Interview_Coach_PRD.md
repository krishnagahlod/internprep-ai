# Product Requirements Document (PRD) & Execution Plan
## Project: AI Interview Coach (IITB Internship Focus)

### 1. Vision & Goals
* Provide a highly practical, free interview preparation tool for juniors.
* Simulate real, high-pressure internship interview environments via chat.
* Focus primarily on non-core roles (Consulting, Finance, PM, AI/DS).
* Deliver precise structural feedback without arbitrary hire/no-hire grading.
* Serve as a strong portfolio piece showcasing functional engineering (RAG, local-first architecture).

### 2. Design Principles
* Maintain a highly minimalist and expressive user interface.
* Use clean typography and functional layouts over visual clutter.
* Implement human-like conversational pauses and cross-questioning logic in the chat UI.
* Keep gamification subtle and minimal.

### 3. Target Audience
* Primary: Second-year students appearing for the internship season.
* Focus Areas: Day 1/Day 2 non-core companies.

### 4. Core Features
* **Resume Upload & Analysis:** Drag-and-drop PDF upload with immediate structural weak-point flagging.
* **Interviewer Console:** Chat-based interface simulating high-stress cross-questioning.
* **Consulting Scratchpad:** Split-screen mode allowing users to type MECE frameworks alongside the chat.
* **Company Intelligence (RAG):** Contextual agent memory loaded via static markdown files of past interview experiences.
* **Post-Interview Evaluation:** Specific feedback on structural soundness, specificity, and correctness.
* **Dual Storage System:** Zero-friction guest mode (IndexedDB) with an optional sync to account (Supabase).

### 5. Technical Architecture
* **Frontend:** Next.js (App Router), Tailwind CSS.
* **State & Local Storage:** React Context, IndexedDB (via localforage).
* **Backend Database:** Supabase (optional authentication and cloud sync).
* **AI Integration:** Vercel AI SDK, calling Claude/OpenAI APIs.
* **RAG System:** Zero-cost local Markdown file parsing mapped to company selection.
* **Hosting:** Vercel (free tier).

### 6. Two-Week Execution Plan

#### Phase 1: Core Interface & Storage (Days 1-4)
* Initialize Next.js project with Tailwind CSS.
* Build a minimalist homepage with "Guest" and "Login" options.
* Set up IndexedDB wrapper for local state management (resume text, target sector, history).
* Implement the PDF upload zone and text extraction utility.
* Write the LLM prompt for initial resume structural review.

#### Phase 2: Interview Console & Scratchpad (Days 5-8)
* Build the split-screen Interview Arena dashboard.
* Program the conversational state machine for the high-pressure interviewer persona.
* Implement simulated typing/loading states for realistic pacing.
* Build the text-based Case Scratchpad for consulting mode.
* Configure the agent to read both the chat input and the live scratchpad state.

#### Phase 3: RAG & Evaluation Engine (Days 9-12)
* Create the `/data/companies/` directory for static markdown intelligence files.
* Build the lookup utility to inject relevant company markdown into the system prompt.
* Develop the Post-Interview Evaluation rubric (STAR format, specificity, technical accuracy).
* Design the feedback UI displaying actionable re-writes for each user response.

#### Phase 4: Polish & Deployment (Days 13-14)
* Implement the Supabase optional sync hook for guest users.
* Refine the minimalist styling and ensure responsive design.
* Test with a small batch of actual users (peers/juniors).
* Deploy to Vercel.

# InternPrep AI: Comprehensive Platform Overview

**InternPrep AI** is an intelligent, highly specialized career preparation ecosystem designed to help top-tier university students (such as those at IIT Bombay) crack highly competitive "Day 1" internships and placements. The platform focuses heavily on non-core roles: Management Consulting, Finance, Product Management, and Data Science.

By leveraging advanced Artificial Intelligence, InternPrep AI provides instantaneous, rigorous, and benchmarked feedback on both resumes and live interviews, acting as an elite, on-demand mentor.

---

## 1. The Problem We Are Solving

At premier institutions, the competition for Day 1 internships (especially at MBB firms: McKinsey, Bain, BCG) is exceptionally fierce. 

**The Core Pain Points:**
1. **The Mentorship Bottleneck:** Success requires rigorous resume reviews and live mock case interviews. Students currently rely on a very small pool of busy senior students or alumni, making high-quality mentorship scarce and inaccessible.
2. **Strict, Unspoken Standards:** "Day 1" resumes have incredibly strict structural and linguistic conventions. A single weak action verb or poorly formatted bullet point can result in a rejection.
3. **Generic AI Tools Fall Short:** Standard tools like ChatGPT provide generic, conversational advice that does not align with the strict benchmarks expected by top-tier recruiters.
4. **Latency in Mock Interviews:** Existing AI voice or chat interviewers take too long to respond (5-10 seconds), which completely breaks the high-pressure conversational flow required for a realistic case interview.

---

## 2. Platform Features & User Journey

InternPrep AI is split into two primary engines: **Resume Intelligence** and **Live Mock Interviews**.

### A. Resume Intelligence (Adaptive Benchmarking)
Users upload their resume (PDF format) and select their target role (e.g., Consulting). The AI does not just grammar-check; it deeply analyzes the structural integrity of every single achievement.

* **Target Role Benchmarking:** The engine adapts its critique based on the role the user is applying for (e.g., highlighting business impact for Consulting vs. technical depth for Data Science).
* **Multimodal Text Extraction:** The system uses advanced vision AI to accurately extract text and hierarchy even from heavily formatted, image-based, or exported PDF resumes.
* **Bullet-Level Adaptive RAG:** The platform extracts every bullet point (typically 20-40 per resume) and uses mathematical vector search to map each bullet to the most similar "Golden Example" from an embedded database of verified, successful past resumes.
* **Granular AI Critique:** The AI evaluates each bullet for:
  * **Weak Action Verbs:** Flagging weak verbs (e.g., "Worked on") and suggesting strong alternatives (e.g., "Engineered", "Spearheaded").
  * **Quantification:** Identifying missing metrics and suggesting exactly what data the user should try to find.
  * **Structure:** Ensuring adherence to the strict *Action + Context + Result (Impact)* format.
* **Visual "Diff" Suggestions:** The UI provides a side-by-side, color-coded comparison (similar to GitHub code reviews) showing exactly what words to change to elevate a weak bullet into a strong one.
* **Interactive Workshop Mode:** If a user struggles to rewrite a bullet, they can enter an interactive chat interface to brainstorm with the AI, feeding it raw data so the AI can help construct the perfect sentence.
* **Radar Scorecards:** Provides a visual radar chart scoring the resume across Quantification, Action Verbs, Formatting, and Section Balance.

### B. Live Case Interview Simulator
A state-of-the-art conversational AI designed to simulate the rigorous, multi-stage structure of a real Management Consulting case interview using actual material from official Casebooks (e.g., IIM Calcutta, Day One Casebooks).

* **Phase-Aware Architecture:** The AI dynamically guides the user through the four distinct phases of a consulting interview:
  1. **Prompt & Clarification:** The AI presents the business problem. The user must ask the right clarifying questions to narrow down the scope.
  2. **Structuring:** The user proposes a MECE (Mutually Exclusive, Collectively Exhaustive) framework to solve the problem. The AI evaluates if the framework is logical.
  3. **Analysis & Computation:** The AI feeds the user data/tables. The user must perform "napkin math" and business logic deductions.
  4. **Synthesis:** The AI pressures the user to provide a final, executive-level recommendation based on their findings.
* **Strict Interviewer Persona:** The AI acts like a real MBB Partner. It will not give away the answer, it will push back on illogical frameworks, and it will force the user to drive the case forward themselves.
* **Post-Interview Scorecard:** After the interview concludes, the user receives a detailed breakdown grading their Communication, Structuring ability, and Mathematical accuracy.

### C. Domain & HR Mock Interviews
Beyond consulting cases, users can launch specialized domain interviews (Data Science, Product Management, Software Engineering) or standard Behavioral/HR interviews. The AI dynamically generates technical questions or behavioral prompts based on the user's uploaded resume and chosen domain.

### D. User Dashboard & History
Users have a centralized dashboard where they can track their progress, view past radar scores, read transcripts of old mock interviews, and continuously monitor their improvement over time. The UI is built with a modern, premium "glassmorphism" aesthetic with full Dark/Light mode support.

---

## 3. Technical Architecture (Under the Hood)

To deliver this seamless, high-performance experience, InternPrep AI utilizes a robust, modern tech stack designed for scale, high concurrency, and ultra-low latency.

* **The Interface (Frontend):** 
  Built using **Next.js 15 (React)** and **Tailwind CSS**, hosted on Vercel. It features real-time Markdown streaming, smooth Framer Motion animations, and a highly responsive design.
* **The Brain (Hybrid AI Engine):**
  * **Google Gemini (1.5 Pro/Flash):** Used for heavy-lifting cognitive tasks like structural PDF parsing, complex JSON schema generation, and compiling the final comprehensive resume reports.
  * **Cerebras (Llama 3.1 70B):** Used exclusively for the live chat mock interviews. Running on highly specialized hardware, Cerebras generates text at mind-bending speeds (~1000 tokens per second). This guarantees that the AI interviewer responds instantly to the user, completely eliminating awkward pauses and preserving the natural flow of a real conversation.
* **The Memory (Database & Vector Store):**
  Powered by **Supabase (PostgreSQL with `pgvector`)**. It securely stores user authentication, session histories, and houses the mathematical embeddings of thousands of verified Day 1 resume bullets and casebooks used for the Adaptive RAG engine.
* **The Infrastructure (Backend & DevOps):**
  * The core logic is a high-concurrency **Python FastAPI** server hosted on **Render**.
  * **Resilient Load Balancing:** To maintain 100% uptime on free-tier infrastructure, the backend implements a custom API key rotation and load-balancing algorithm. If an AI provider rate-limits a request or a model goes offline, the system seamlessly intercepts the error, switches keys or fallback models, and retries the request without the user ever noticing a failure.
  * **Zero Cold-Start:** The frontend utilizes a silent background ping the moment a user lands on the site. This quietly wakes up the sleeping backend server while the user is reading the landing page, ensuring zero wait time when they actually begin an interview.

---

## 4. The Vision

InternPrep AI democratizes access to elite interview preparation. By codifying highly guarded institutional knowledge and leveraging bleeding-edge AI infrastructure, it ensures that every student—regardless of their immediate network or background—has the tools necessary to compete for the world's most coveted internship roles.

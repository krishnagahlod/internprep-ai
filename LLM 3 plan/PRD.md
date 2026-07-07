Product Requirements Document (PRD) & Execution Plan
Project: AI Interview Coach (IITB Internship Focus)
1. Vision & Goals
Primary Objective: Create a practical, free interview preparation tool to aid IITB juniors in navigating the internship season, focusing on non-core roles like Consulting, Finance, PM, and AI/DS.

Secondary Objective: Develop a strong portfolio project demonstrating applied AI skills (RAG, local-first architecture, LLM engineering) without relying on arbitrary grading systems (like hire/no-hire).

Success Metric: Provide a realistic simulation of high-pressure internship interview environments that students find genuinely helpful for preparation.

2. Design Principles
Minimalist & Expressive: The user interface must be clean, prioritizing functional layouts and clear typography over visual clutter.

Realistic Simulation: The chat UI should mimic human conversational patterns, including simulated typing pauses, interruptions, and high-pressure cross-questioning logic.

Subtle Gamification: Gamification elements should be present but kept to a minimum to avoid distracting from the core preparation task.

3. Target Audience & Context
Primary Users: Second-year IIT Bombay students preparing for the internship season.

Focus Area: Day 1/Day 2 non-core companies (e.g., McKinsey, BCG, Goldman Sachs, Sprinklr).

Contextual Understanding:

The IITB placement process is hybrid, involving both in-person and remote interviews via platforms like Zoom or Google Meet.

The process involves tight schedules, with multiple slots within a day (e.g., Day 1.1, Day 1.2).

Students face high stress and often struggle with the diversity of tests and interview formats.

4. Core Features
Resume Upload & Analysis: A drag-and-drop PDF upload feature that immediately flags structural weak points, vague phrasing, or lack of metrics, tailored to the dense IITB resume format.

Interviewer Console: A chat-based interface that simulates high-stress cross-questioning, focusing on depth and structural soundness.

Consulting Scratchpad: A split-screen mode for consulting cases, allowing users to type MECE frameworks and calculations alongside the chat.

Company Intelligence (RAG): Contextual agent memory loaded via static markdown files, utilizing past internship experiences and interview logs. This will simulate company-specific intelligence (e.g., FMCG companies like ITC or Reckitt Benckiser vs. Finance roles at Barclays or Deutsche Bank).

Post-Interview Evaluation: Specific, actionable feedback on structural soundness (e.g., use of the STAR format), specificity, and technical accuracy.

Dual Storage System: A zero-friction guest mode using IndexedDB, with an optional Supabase sync for cross-device tracking.

5. Technical Architecture
Frontend: Next.js (App Router), Tailwind CSS.

State & Local Storage: React Context, IndexedDB (via localforage) for a $0 database cost for guest users.

Backend Database: Supabase (for optional authentication and cloud sync).

AI Integration: Vercel AI SDK calling Claude or OpenAI APIs for the conversational agent.

RAG System: A zero-cost local Markdown file parsing system mapped to company selections.

Hosting: Vercel (free tier).

6. Execution Plan & Suggestions (2-Week Sprint)
Phase 1: Core Interface & Storage (Days 1-4)
Task: Initialize the Next.js project and build the minimalist homepage. Set up the IndexedDB wrapper for local state management.

Task: Implement the PDF upload zone and write the text extraction utility.

Suggestion: Ensure the resume parser is specifically tuned to the IITB resume template to catch common formatting or structural errors early.

Phase 2: Interview Console & Scratchpad (Days 5-8)
Task: Build the split-screen Interview Arena and program the high-pressure conversational state machine.

Task: Implement the text-based Case Scratchpad for consulting mode, configuring the AI to monitor both chat and scratchpad inputs.

Suggestion: Since IITB interviews can happen rapidly, design the AI to challenge the user if they take too long to formulate a response in the scratchpad, mimicking real-world pressure.

Phase 3: RAG & Evaluation Engine (Days 9-12)
Task: Create the /data/companies/ directory and populate it with static markdown files containing company intelligence.

Task: Develop the Post-Interview Evaluation rubric and design the feedback UI.

Suggestion: When curating the RAG markdown files, categorize them by the types of roles typically offered by the companies at IITB (e.g., categorizing FMCG companies differently from pure consulting firms).

Phase 4: Polish & Deployment (Days 13-14)
Task: Implement the optional Supabase sync for users who wish to track their progress.

Task: Test with actual users, refine styling, and deploy to Vercel.

Suggestion: Have peers or juniors test the platform specifically against the constraints of an online interview setting (e.g., using a webcam and headphones as required by the PT Cell) to ensure the UI remains usable under those conditions.

This document provides a comprehensive roadmap for building an effective and highly relevant tool for the IITB internship season.
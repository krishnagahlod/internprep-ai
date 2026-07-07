# PROJECT_CONTEXT.md

## AI Internship Mentor

> Living document. Update this at the beginning and end of every
> development session.

------------------------------------------------------------------------

# Project Snapshot

**Current Phase:** MVP Development

**Current Milestone:** Project Initialization

**Overall Goal:** Build an AI-powered internship preparation platform
focused on IIT Bombay students, with resume intelligence,
company-specific preparation, AI mock interviews, and personalized
feedback.

------------------------------------------------------------------------

# Core Documents

Before making any architectural or product decisions, consult:

1.  Product Bible
2.  Technical Bible
3.  Implementation Bible

These are the source of truth.

------------------------------------------------------------------------

# Current Objective

Build a polished MVP that allows a student to:

-   Sign in
-   Upload a resume
-   Select a company
-   View AI-generated preparation
-   Complete a mock interview
-   Receive personalized feedback

------------------------------------------------------------------------

# Current Sprint

## Sprint 1 --- Foundation

### Deliverables

-   Next.js project
-   FastAPI backend
-   Supabase setup
-   Authentication
-   Initial deployment
-   Monorepo structure

### Definition of Done

-   Local development works
-   Authentication works
-   Frontend communicates with backend
-   CI/CD configured
-   Deploy preview available

------------------------------------------------------------------------

# Locked Technical Decisions

Frontend - Next.js - TypeScript - Tailwind CSS - shadcn/ui

Backend - FastAPI

Database - Supabase PostgreSQL - pgvector

Deployment - Vercel - Railway/Render - Supabase

Architecture - Modular services - RAG-first - AI provider abstraction

These should not change without updating the Technical Bible.

------------------------------------------------------------------------

# Current Folder Ownership

apps/web → Frontend

apps/api → Backend

packages/ui → Shared UI

packages/ai → AI services

packages/prompts → Prompt templates

packages/shared → Shared utilities

packages/database → Database helpers

------------------------------------------------------------------------

# Coding Rules

-   Never duplicate business logic.
-   Keep prompts outside application code.
-   Keep AI providers interchangeable.
-   Keep components small.
-   Prefer composition over inheritance.
-   Write meaningful commit messages.

------------------------------------------------------------------------

# Knowledge Base Status

Sources planned:

-   IITB interview experiences
-   Company preparation guides
-   Resume examples
-   HR questions
-   Consulting cases
-   Guesstimates

Current status: ☐ Collection not started

------------------------------------------------------------------------

# Outstanding Decisions

-   Final product name
-   Branding
-   Voice support timeline
-   Community moderation
-   Initial knowledge corpus

------------------------------------------------------------------------

# Known Risks

-   Weak knowledge quality
-   Hallucinated interview advice
-   Poor prompt quality
-   Scope creep
-   Overengineering

Mitigation: Keep MVP focused.

------------------------------------------------------------------------

# Session Checklist

Before Coding

□ Read current milestone □ Pull latest code □ Define today's objective □
Decide acceptance criteria

After Coding

□ Run tests □ Update documentation □ Commit changes □ Deploy preview □
Record blockers

------------------------------------------------------------------------

# AI Coding Prompt Template

Use this context for every coding session:

Project: AI Internship Mentor

Current Sprint: `<update>`{=html}

Current Task: `<update>`{=html}

Relevant Files: `<update>`{=html}

Acceptance Criteria: `<update>`{=html}

Constraints: - Follow Product Bible. - Follow Technical Bible. - Follow
Implementation Bible. - Keep code modular. - Avoid unnecessary
dependencies. - Explain architectural decisions in comments only when
needed.

------------------------------------------------------------------------

# Progress Tracker

Infrastructure \[ \]

Authentication \[ \]

Resume Upload \[ \]

Resume Intelligence \[ \]

Knowledge Hub \[ \]

Company Hub \[ \]

Interview Engine \[ \]

Feedback Engine \[ \]

Deployment \[ \]

Public MVP \[ \]

------------------------------------------------------------------------

# Notes

Use this section as a running engineering log.

Date: Decision: Reason: Next Steps:

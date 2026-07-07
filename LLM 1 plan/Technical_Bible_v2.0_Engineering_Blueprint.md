# Technical Bible v2.0 --- Engineering Blueprint

## AI Internship Mentor

> This document is intended to be the primary engineering context for AI
> coding agents.

# 1. Architecture Decisions (Locked)

## Frontend

-   Next.js (App Router)
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   TanStack Query
-   Zustand

## Backend

-   FastAPI
-   Pydantic
-   SQLAlchemy
-   Alembic

## Database

-   Supabase PostgreSQL
-   pgvector
-   Supabase Storage
-   Supabase Auth

------------------------------------------------------------------------

# 2. Repository Structure

apps/ web/ api/

packages/ ai/ prompts/ ui/ shared/ database/

docs/

scripts/

------------------------------------------------------------------------

# 3. Backend Modules

/api auth resume company interview feedback search community health

/services rag llm embeddings parsing scoring

/agents resume company interviewer feedback orchestrator

------------------------------------------------------------------------

# 4. Frontend Routes

/

dashboard

/company/\[slug\]

/interview

/resume

/knowledge

/community

/profile

/settings

------------------------------------------------------------------------

# 5. Database Schema

Users

Resumes

ResumeBullets

Companies

CompanyResources

InterviewExperiences

KnowledgeDocuments

InterviewSessions

Messages

FeedbackReports

Bookmarks

CommunityPosts

Comments

Votes

Indexes: - pgvector - company slug - user id - session id

------------------------------------------------------------------------

# 6. API Contracts

POST /resume/upload

POST /resume/analyze

GET /company/{slug}

POST /interview/start

POST /interview/message

POST /feedback/generate

GET /knowledge/search

POST /community/post

Every endpoint returns: status message data metadata

------------------------------------------------------------------------

# 7. AI Pipeline

User Input

↓

Orchestrator

↓

Intent Detection

↓

Context Retrieval

↓

Agent Selection

↓

LLM

↓

Validation

↓

Response

------------------------------------------------------------------------

# 8. RAG Pipeline

Collect

Clean

Normalize

Chunk

Embed

Store

Retrieve

Re-rank

Inject Context

Answer

Metadata: company role year department source tags

------------------------------------------------------------------------

# 9. Prompt Repository

prompts/ resume.md company.md interviewer.md feedback.md retrieval.md
system.md

Prompt rules: - versioned - isolated - testable - reusable

------------------------------------------------------------------------

# 10. Environment Variables

NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

OPENAI_API_KEY OPENROUTER_API_KEY GOOGLE_API_KEY

EMBEDDING_MODEL LLM_MODEL

------------------------------------------------------------------------

# 11. Coding Standards

-   Strict TypeScript
-   Black + Ruff for Python
-   Small reusable services
-   Dependency injection
-   No business logic in routes
-   AI providers behind interfaces

------------------------------------------------------------------------

# 12. Logging

Log: - API latency - prompt execution - retrieval latency - LLM cost -
failures

Never log: - resume contents - API keys - personal identifiers

------------------------------------------------------------------------

# 13. Testing

Frontend - Playwright

Backend - Pytest

AI - Prompt regression tests - Golden answer evaluation - Retrieval
quality tests

------------------------------------------------------------------------

# 14. Error Strategy

Retry: - transient LLM errors

Fallback: - secondary provider

Graceful degradation: - search without AI - cached responses

------------------------------------------------------------------------

# 15. Cost Optimisation

-   cache embeddings
-   cache retrieval
-   summarize long context
-   model routing
-   async ingestion

------------------------------------------------------------------------

# 16. Future Upgrades

When MVP validates:

-   LangGraph orchestration
-   MCP integrations
-   Live voice
-   Redis
-   Background workers
-   Event bus
-   Evaluation dashboard

Do NOT introduce these before validation.

------------------------------------------------------------------------

# 17. Build Order

Sprint 1 Foundation

Sprint 2 Authentication + Database

Sprint 3 Resume Upload

Sprint 4 Knowledge Hub

Sprint 5 Company Hub

Sprint 6 Interview Engine

Sprint 7 Feedback Engine

Sprint 8 Community

------------------------------------------------------------------------

# Engineering Rules

1.  Keep architecture modular.
2.  Optimize for maintainability.
3.  Prefer simple solutions over frameworks.
4.  AI should be replaceable.
5.  Every feature should be independently testable.
6.  Design for future expansion without overengineering the MVP.

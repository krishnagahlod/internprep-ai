# InternPrep AI — AI Interview Coach & Campus Placement Preparation Platform

Full-stack production platform for technical and behavioral interview preparation, AI case interview coaching, placement analytics, and resume ATS auditing.

## Architecture
- **Web (pps/web)**: Next.js 16 (App Router), React 19, Tailwind CSS, Sentry, PostHog.
- **API (pps/api)**: FastAPI, Python 3.13, Groq, Google Gemini, Cerebras, Supabase, Razorpay.

## Security Notice & Key Rotation Warning
> **IMPORTANT SECURITY ADVISORY:**
> 1. All secrets, API keys, database credentials, and signing secrets MUST be configured strictly via environment variables. Refer to .env.example for required variables.
> 2. **Key Rotation**: If any API key, database password, or webhook secret was ever previously exposed, committed, or shared in a public channel or git history, **rotate it immediately in the respective vendor console** (Supabase, Razorpay, Google AI Studio, Groq).
> 3. **Client-Side Exposure**: Only variables prefixed with NEXT_PUBLIC_ are bundled to the browser. Under no circumstances should SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_SECRET, or LLM gateway keys be prefixed with NEXT_PUBLIC_.

## Setup & Running Locally
1. Copy .env.example to pps/api/.env and pps/web/.env.local.
2. Install dependencies:
   - Backend: cd apps/api && pip install -r requirements.txt
   - Frontend: cd apps/web && npm install
3. Start backend: cd apps/api && uvicorn main:app --reload --port 8000
4. Start frontend: cd apps/web && npm run dev

# Data Collection Guide for InternPrep AI

To make the AI Interview Coach as accurate and valuable as possible, we need high-quality data. I have created the folder structure for you in the `data/` directory.

## What you need to do:
1. Gather your documents (PDFs, Word docs, Markdown, or text files).
2. Place them into the correct folders inside `data/companies/` or `data/general/`.
3. Give the files descriptive names (e.g., `bcg_interview_experiences_2025.pdf`, `goldman_sachs_quant_prep.md`).

## The Folder Structure

I have already created this structure for you:
```text
data/
├── companies/
│   ├── consulting/   (For McKinsey, BCG, Bain, LEK, Strategy&, NRI, Accenture)
│   ├── finance/      (For Morgan Stanley, Bernstein, Apollo, Deutsche Bank)
│   ├── fmcg/         (For P&G, ITC, HUL)
│   └── analytics/    (For Amex, Finmechanics, Fractal.ai)
└── general/          (For general frameworks, HR questions, etc.)
```

## What kind of content to drop into these folders:

### 1. Interview Experiences (The Goldmine)
*Put these in the specific company folders (e.g., `data/companies/consulting/`)*
- Senior interview logs or compiled docs detailing actual interview rounds.
- Details like: "Round 1 was a guesstimate about XYZ. Round 2 was a profitability case."
- Information on the *vibe* of the interview (e.g., "The interviewer was very aggressive on numbers").

### 2. Company Process Details
*Put these in the specific company folders*
- Documents detailing how a specific company hires at IITB.
- Details like: "McKinsey takes a buddy round first, then 2 final interviews. They focus heavily on MECE structuring."

### 3. Specific Question Banks
*Put these in the specific company folders if company-specific, or `general/` if applicable to all*
- Lists of HR questions, brainstormer questions, or technical questions (for analytics/finance) that are frequently asked.

### 4. Case Frameworks
*Put these in `data/general/`*
- Your own notes or standard frameworks (profitability, market entry, pricing).
- We use this so the AI knows what a "good" structure looks like when evaluating the student's scratchpad.

## Next Steps
Once you have placed all the files in the folders, let me know! I will write a script to ingest all of this into the Supabase database.

### Supabase Setup Reminder
Don't forget to:
1. Run the `schema.sql` file in your Supabase SQL Editor.
2. Fill in the `.env` files (copy `.env.example` to `.env.local` in `apps/web` and `.env` in `apps/api`) with your Supabase and API keys!

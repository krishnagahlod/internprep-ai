# Internprep.AI — Accenture Management Consulting Interview Simulation

## Product Ideation, Data Strategy, AI Pipeline & Implementation Context

## 1. Purpose of This Document

This document captures the complete ideation and implementation direction for the **Accenture-specific mock interview feature** being added to Internprep.AI.

It is intended to be placed inside the project repository and used as context by Antigravity or another AI coding agent.

The existing Internprep.AI project already contains the general interview infrastructure, including role/domain selection, resume selection, voice interaction, browser-based STT/TTS, dynamic follow-up generation, scoring, session storage, and other existing functionality. This document therefore focuses specifically on **what we want to build for the Accenture-specific interview layer, how the data should be collected and processed, and how that intelligence should eventually drive the live interviewer.**

The first target is:

> **Accenture Global — Management Consulting Associate / Summer Internship interview for IIT Bombay students graduating in 2028.**

The feature should ultimately feel like a realistic, guided preparation experience rather than a generic AI interview.

---

# 2. Executive Summary

The objective is **not** to build an Accenture question bank.

The objective is to reconstruct the interview experience closely enough that an IITB student can practice a realistic 20–30 minute Accenture Management Consulting interview before the real interview.

The system should model:

- Interview structure
- Question categories
- Question frequency
- Question sequencing
- Resume-driven questioning
- Candidate-specific branching
- Follow-up patterns
- Interviewer reactions
- Interviewer probing behavior
- Case/business problem behavior
- AI/GenAI questioning
- Behavioral/HR questioning
- Interview difficulty
- Time progression
- Closing behavior
- Candidate evaluation

The core idea is:

> **Question → Candidate Answer → Interviewer Reaction/Decision → Follow-up → Next Topic**

A real interviewer does not simply follow a fixed list of questions. The next question depends heavily on what the candidate just said.

Therefore, the Accenture simulator should combine:

1. Historical interview data
2. Current-year interview data
3. Structured interview patterns
4. An AI-generated/AI-processed knowledge base
5. Candidate resume intelligence
6. An explicit live interview state
7. A controlled Accenture interviewer persona
8. Dynamic branching and follow-ups

The recommended first implementation is **not fine-tuning**.

Instead, initially use:

> **Structured data + AI preprocessing + retrieval/RAG + explicit interview state + LLM**

This will provide more control, easier updating, and better transparency than immediately fine-tuning a model.

---

# 3. Target Interview

Current understanding of the interview being simulated:

| Attribute | Current understanding |
|---|---|
| Company | Accenture Global |
| Role | Management Consulting Associate / consulting internship |
| Program | Summer internship |
| Primary audience | IIT Bombay students |
| Target cohort | 2028 graduating batch |
| Format | Online |
| Typical format | Individual interview |
| Approximate duration | 20–30 minutes |
| Interviewer | Generally manager-level or higher |
| Interview rounds | Two rounds have been observed |
| Round similarity | Both rounds are broadly similar in nature |

The following is the **current hypothesis** about the interview flow and must be validated through data rather than hardcoded as fact:

1. Introduction and/or resume discussion
2. Resume-driven questions
3. Internship/project/research/POR discussion
4. Consulting/business problem or case in some interviews
5. AI/GenAI questions
6. Behavioral/HR questions
7. Closing / candidate questions

---

# 4. Product Goal

The desired experience is:

> **A realistic 20–30 minute Accenture Management Consulting interview simulation for an IITB candidate, personalized to their resume and informed by real interview experiences.**

The student should receive a **guided preparation experience with interview-like interaction**.

Before starting, the student should know:

- This is an Accenture-specific simulation
- Approximate duration
- Broad areas that may be covered
- Their resume will be used
- The exact questions are not predetermined

During the interview:

- The interviewer should behave naturally
- The interviewer should ask one question at a time
- Follow-ups should depend on the candidate's answers
- Resume claims should influence the conversation
- The interviewer should probe when appropriate
- The interviewer should challenge unsupported claims when appropriate
- The interviewer should move on when sufficient information has been obtained
- The interview should feel like a real conversation rather than a chatbot questionnaire
- No coaching should be provided during the interview except natural case-interview hints where the simulated interviewer would reasonably provide them

After the interview:

- The student should receive an Accenture-specific readiness report
- Evaluation should be based on the actual conversation
- Feedback should identify concrete strengths and weaknesses
- The system should recommend what the candidate should prepare before the real interview

---

# 5. What This Feature Is NOT

The implementation should explicitly avoid becoming any of the following:

### Not a static question bank

The system should not simply randomly select 15 questions from a database.

### Not a deterministic script

Every student should not receive:

> Tell me about yourself → Why consulting? → Project → Case → AI → HR

The broad structure can be consistent while the exact trajectory varies.

### Not a generic consulting interview

The interview should reflect Accenture-specific patterns observed in the collected data.

### Not an unsupported prediction engine

The product should never imply:

> “Accenture will definitely ask this question.”

Instead, the language should reflect evidence and probability.

### Not an internet-anecdote aggregator

Public interview experiences are useful but should not automatically override direct IITB/current-year evidence.

### Not an immediate fine-tuning project

Fine-tuning should only be considered after the structured/RAG/stateful approach has been tested.

---

# 6. Core Design Principle: Reconstruct the Interview

The most important conceptual decision is that the system should model **interview trajectories**, not isolated questions.

The fundamental unit should be:

```text
Question
    ↓
Candidate Answer
    ↓
Interviewer Reaction / Decision
    ↓
Follow-up
    ↓
Candidate Answer
    ↓
Interviewer Decision
    ↓
Next Topic
```

Example:

```text
Interviewer:
Tell me about your internship.

Candidate:
I worked on an ML system that reduced processing time by 40%.

Interviewer:
How did you measure the 40% improvement?

Candidate:
We compared...

Interviewer:
What was the baseline?

Candidate:
...

Interviewer:
And what was your personal contribution?

Candidate:
...

Interviewer:
Interesting. Let's move to a business problem...
```

This is much more valuable than storing:

> “Question: Tell me about your internship.”

The simulator needs to know **what kinds of answers cause what kinds of follow-ups**.

---

# 7. Data Sources

The planned data sources are:

## 7.1 IIT Bombay historical interviews

Potentially:

- 5–6 highly detailed participants
- Up to 12–15 participants if possible
- Historical IITB interview pool was approximately 50–60 candidates

This is the most relevant historical source because the target students are IITB students.

Expected value:

> Very High

---

## 7.2 Current-year interviews from other IITs

Current contacts include people from:

- IIT Delhi
- IIT Madras
- IIT Kharagpur
- IIT Dhanbad

They are interviewing for the same or substantially similar role.

Additional IIT contacts should be pursued if possible.

Expected value:

> High

This data is especially important because it tells us what Accenture is doing **in the current recruitment cycle**, rather than relying only on historical IITB interviews.

---

## 7.3 Public internet experiences

Potential sources include publicly available:

- Accenture interview experiences
- Accenture Strategy & Consulting experiences
- IIT placement experiences
- Recent interview reports
- Public student discussions

Expected value:

> Medium / Low-to-Medium depending on source quality

Public data should mainly be used to:

- Discover additional question types
- Identify possible patterns
- Fill gaps
- Cross-check internally observed patterns

It should not override strong first-party interview evidence.

---

# 8. Evidence Hierarchy

Different sources should have different weights.

Recommended hierarchy:

| Source | Suggested confidence |
|---|---|
| Current-year same-role interview + direct conversation | Very High |
| IITB interview + detailed direct conversation | Very High / High |
| Multiple current-year same-role reports agreeing | High |
| IITB historical form response with good recall | High |
| Other IIT form response | Medium–High |
| Single public interview report | Medium / Low |
| Old or weakly remembered public anecdote | Low |

This should eventually become part of the knowledge-base metadata.

---

# 9. Data Collection Strategy

Two different data collection methods are planned.

## 9.1 Short standardized experience form

The form should take approximately:

> **5–8 minutes**

The purpose is to collect standardized information from many people without exhausting them.

The form should prioritize:

- Candidate background
- Interview metadata
- Interview sections
- Approximate interview order
- Important questions remembered
- Follow-up questions
- AI questions
- Case questions
- Behavioral questions
- Interviewer behavior
- Key preparation insights

Only highly relevant questions should be mandatory.

AI and case sections should be conditional.

### Important form design principle

Do not ask respondents to reconstruct every detail through 30+ separate fields.

Instead, use a few high-value questions such as:

> “List the most important questions you remember, preferably in chronological order.”

and:

> “Which 2–3 questions had the most follow-ups?”

This keeps completion rates high.

---

# 10. Historical Interview Experience Form

The planned form should approximately contain:

## Basic information

Required:

- Institute
- Branch
- Graduation year
- Role
- Interview year
- Approximate duration
- Number of interviewers

Optional:

- Interviewer seniority

## Interview structure

Ask:

- Which areas were covered?
- What was the approximate order?

Possible areas:

- Introduction
- Resume
- Internship
- Projects
- Research
- Consulting/business questions
- Case
- Guesstimate
- AI/GenAI
- Technical
- HR/Behavioral
- Leadership/Situational
- Other

## Questions

Ask:

> “List the most important questions you remember, preferably in chronological order.”

Optional:

> “Which 2–3 questions generated the most follow-ups?”

Optional:

> “Was there anything surprising or unexpected?”

## AI

Ask whether AI/GenAI questions were asked.

If yes:

- What were the questions?
- Were they technical, conceptual, business/consulting-oriented, or mixed?

## Case

Ask whether a case/business problem was given.

If yes:

- Briefly describe it
- Identify case type if possible

Potential case types:

- Profitability
- Market entry
- Market sizing
- Growth
- Operations
- Strategy
- Pricing
- AI/Digital transformation
- Other

## Behavioral

Capture remembered behavioral questions.

Specifically ask whether:

- “Why Consulting?”
- “Why Accenture?”

were asked.

## Interviewer behavior

Capture:

- Friendly/formal/conversational/challenging/etc.
- Probing intensity
- Whether answers were challenged
- Whether the interview felt conversational, structured, technical, case-based or mixed

## Key insights

Ask:

- What was the most difficult part?
- What do you wish you had prepared better?
- What is the one thing you would tell a student preparing for the same interview?

## Follow-up

Ask whether they are willing to have a short conversation for clarification.

---

# 11. Direct Interview / Debrief Strategy

The form should be the **breadth layer**.

Personal conversations should be the **depth layer**.

For historical IITB candidates, a conversation can be approximately:

> 30–45 minutes

For current-year candidates immediately after their interview:

> 10–15 minutes

The most important rule for direct conversations is:

> **Reconstruct the interview rather than asking for a summary.**

Start with:

> “Imagine you've just joined the interview. What happened first?”

Then repeatedly ask:

> “What happened next?”

> “What exactly did they ask?”

> “What did you answer?”

> “What did they ask after that?”

This avoids accidentally leading the respondent toward the categories we already expect.

---

# 12. Direct Interview Script

## Opening

Explain:

> “I'm building an Accenture-specific interview preparation experience for IITB students. I'm not looking for general interview advice. I want to reconstruct what actually happened in your interview so that the simulation can behave realistically. I may interrupt occasionally to ask what happened next or what the exact follow-up was. You don't need to remember exact wording; the sequence and meaning are more important.”

## Context

Ask:

- What role?
- Which round?
- When?
- How long?
- How many interviewers?
- Approximate seniority?
- Did they have your resume?

## Full chronological reconstruction

Ask:

> “Imagine you've just joined the call. What happened first?”

Then keep reconstructing.

For every interesting topic:

- What was the question?
- What did you answer?
- What happened next?
- Was there a follow-up?
- What did the interviewer seem interested in?
- How long did the discussion last?

## Resume investigation

Ask:

- Which resume item received the most attention?
- What exactly did they ask?
- Did they challenge any claims?
- Did they ask about something not explicitly written?
- Did your answer cause them to go deeper?
- Did they move away because the answer was sufficient?

## Case investigation

If applicable:

- What was the initial problem?
- What did you say first?
- How did the interviewer react?
- Did they give data?
- Did they challenge the framework?
- Did they provide hints?
- What calculations were required?
- What ended the case?

## AI investigation

If applicable:

- How did AI enter the conversation?
- What was the first AI question?
- Was it technical or business-oriented?
- Were GenAI/LLMs discussed?
- Were applications discussed?
- Were limitations/risks discussed?
- Was AI connected to a business problem?
- What did you think they were trying to evaluate?

## Behavioral investigation

Ask:

- What behavioral questions were asked?
- Why consulting?
- Why Accenture?
- Long-term goals?
- Leadership?
- Conflict?
- Failure?
- Did they challenge the answers?

## Interviewer behavior

Ask:

- How would you describe the interviewer?
- Were they conversational?
- Did they interrupt?
- Did they challenge answers?
- Did they ask “why” frequently?
- Did they ask “how” frequently?
- Did they ask for examples?
- Did they ask for quantification?
- Did they give hints?
- Did they revisit earlier answers?
- Did they change topics abruptly?
- Did the interview feel like a conversation or interrogation?

## Pressure points

Ask:

> “What were the 2–3 moments where the interview became most difficult?”

For each:

- What were they asking?
- Why was it difficult?
- What did the interviewer do?
- What happened afterward?

## Closing

Ask:

- How did the interview end?
- What was the final question?
- Were candidate questions invited?
- What did you ask?
- Did they discuss next steps?
- Anything unusual in the final few minutes?

## Retrospective

Ask:

1. What surprised you most?
2. What did you prepare for that was unnecessary?
3. What did you not prepare for?
4. What separates strong candidates from weak candidates?
5. What would you change if you repeated the interview?
6. What do you think Accenture was evaluating?
7. What can a question bank never capture about the interviewer's style?

The final question is especially valuable because it reveals interviewer behavior that is not visible from a list of questions.

---

# 13. Current-Year Interview Debrief

For students interviewing this year, data quality can be improved substantially by collecting information immediately after the interview.

Ideal process:

```text
Interview ends
      ↓
5–10 minute debrief form
      ↓
15–30 minutes later
      ↓
10–15 minute conversation
      ↓
Chronological reconstruction
```

The short current-year form should ask:

- Institute
- Role
- Interview date
- Duration
- Interviewer count/seniority
- Every question remembered, in order
- Longest discussion
- Topics covered
- Follow-up behavior
- AI questions
- Case questions
- Final part of interview
- What surprised them
- What they wish they had prepared

This data is particularly valuable because recall is freshest.

---

# 14. Candidate Profile Data

A major part of realistic simulation is understanding that interviews vary according to candidate profile.

The system should capture or derive relevant resume features such as:

- Branch
- CGPA range where appropriate
- Internships
- Projects
- Research
- PORs
- Leadership
- Consulting competitions
- Technical skills
- AI/ML experience
- Startup/entrepreneurship experience
- Quantitative achievements
- Unusual resume claims
- Important metrics

The goal is not to expose personal information.

The goal is to understand:

> **What type of candidate profile tends to produce what type of interview trajectory?**

---

# 15. Proposed Interview Taxonomy

The initial taxonomy should include:

## A. Opening

- Introduction
- Tell me about yourself
- Background
- Academic choices

## B. Resume

- Resume walkthrough
- Internship
- Projects
- Research
- POR/leadership
- Achievements
- Technical skills

## C. Consulting

- Business problem
- Case
- Profitability
- Market entry
- Market sizing
- Growth
- Operations
- Strategy
- Pricing
- Digital transformation
- Structured problem solving

## D. AI

- AI fundamentals
- Machine learning
- Generative AI
- LLMs
- RAG
- Agents
- AI applications
- AI strategy
- AI implementation
- AI risks/ethics
- AI + consulting
- Explaining AI to non-technical stakeholders

## E. Behavioral / HR

- Why consulting?
- Why Accenture?
- Why should we hire you?
- Strengths/weaknesses
- Leadership
- Conflict
- Failure
- Teamwork
- Pressure
- Ambiguity
- Career goals
- Five-year plan

## F. Closing

- Candidate questions
- Final comments
- Next steps

This taxonomy is an initial framework and should evolve based on evidence.

---

# 16. Raw Data → AI Pipeline

Raw interview responses should **not** be directly inserted into the live interviewer prompt.

A preprocessing pipeline should convert raw experiences into structured interview intelligence.

Recommended pipeline:

```text
Raw Form Responses
        +
Interview Notes / Transcripts
        +
Public Interview Sources
        ↓
Data Cleaning
        ↓
PII / Unnecessary Information Removal
        ↓
Interview Segmentation
        ↓
Question / Answer Extraction
        ↓
Taxonomy Classification
        ↓
Follow-up Extraction
        ↓
Interviewer Behavior Extraction
        ↓
Transition / Branch Extraction
        ↓
Question Normalization
        ↓
Duplicate / Semantic Clustering
        ↓
Frequency Analysis
        ↓
Evidence & Confidence Assignment
        ↓
Pattern Aggregation
        ↓
Accenture Interview Knowledge Base
```

The pipeline can initially involve manual validation and gradually become more automated.

---

# 17. AI Extraction Responsibilities

The AI preprocessing layer should be able to extract:

### Interview metadata

- Institution
- Year
- Role
- Duration
- Interviewer count
- Interviewer seniority
- Round

### Candidate profile

- Branch
- Resume features
- Internships
- Projects
- Skills
- Leadership
- Relevant experience

### Interview sequence

For each step:

- Question
- Question type
- Candidate answer
- Follow-up
- Candidate response
- Interviewer reaction
- Transition
- Approximate duration
- Confidence

### Interviewer behavior

- Probing intensity
- Challenge frequency
- Interruptions
- Encouragement
- Formality
- Conversational behavior
- Hints
- Topic transitions
- Revisit behavior

### Cases

- Case type
- Initial problem
- Information revealed
- Calculations
- Assumptions
- Challenges
- Hints
- Resolution

### AI

- Topic
- Question
- Technical/business orientation
- Follow-up
- Difficulty

### Behavioral

- Question
- Follow-up
- Candidate response
- Challenge level

---

# 18. Evidence Model

Every extracted item should retain evidence metadata.

Recommended evidence types:

### OBSERVED / REPORTED

The respondent directly states that something happened.

### RECALLED

The candidate remembers something but may not remember exact wording.

### INFERRED

The AI or aggregation layer identifies a pattern across multiple interviews.

### INTERPRETED

The candidate's opinion about why the interviewer asked something or what they were evaluating.

These should not be treated equally.

For example:

> “The interviewer asked about RAG.”

This is reported/recalled evidence.

But:

> “They were testing whether I understood AI implementation.”

This is an interpretation.

The second should not be presented as an established fact.

---

# 19. Structured Interview Record

Each interview should eventually become a structured record similar to:

```json
{
  "interview_id": "...",

  "source": {
    "institute": "IIT Bombay",
    "year": 2025,
    "role": "Management Consulting Associate Intern",
    "collection_method": "direct_debrief"
  },

  "metadata": {
    "duration_minutes": 25,
    "interviewer_count": 1,
    "interviewer_seniority": "manager_or_above"
  },

  "candidate_profile": {
    "branch": "...",
    "resume_features": [
      "consulting competition",
      "AI project",
      "internship"
    ]
  },

  "sequence": [
    {
      "step": 1,
      "type": "introduction",
      "question": "...",
      "answer": "...",
      "follow_ups": [],
      "reaction": "moved_on",
      "confidence": "high"
    },
    {
      "step": 2,
      "type": "project",
      "question": "...",
      "answer": "...",
      "follow_ups": [
        "...",
        "..."
      ],
      "reaction": "probed_deeper",
      "confidence": "high"
    }
  ],

  "interviewer_behavior": {
    "probing_intensity": 4,
    "style": [
      "conversational",
      "challenging"
    ]
  }
}
```

The exact schema should follow the existing project's architecture, but these concepts should be preserved.

---

# 20. Question Knowledge Base

A normalized question should contain much more than text.

Recommended fields:

```text
canonical_question
category
subcategory
observed_frequency
IITB_frequency
current_year_frequency
same_role_frequency
source_interviews
difficulty
typical_followups
candidate_triggers
observed_reactions
common_transitions
evidence_type
confidence
last_observed_date
```

Example:

```json
{
  "canonical_question": "Tell me about your internship",
  "category": "resume",
  "subcategory": "internship",
  "observed_frequency": 12,
  "iitb_frequency": 6,
  "current_year_frequency": 5,
  "difficulty": "medium",
  "typical_followups": [
    "What exactly did you contribute?",
    "Why did you choose this approach?",
    "How did you measure the impact?"
  ],
  "confidence": "high"
}
```

---

# 21. Frequency and Pattern Analysis

The knowledge base should support statements such as:

> “This question appears in 8 of 11 IITB interviews.”

or:

> “AI questions appear in 7 of 9 current-year same-role interviews.”

or:

> “Project → AI transitions are common for candidates with AI-related resume projects.”

The exact numbers should be generated from the data.

The system should not hardcode assumptions.

---

# 22. Interview Flow Model

The simulator should use a **base flow with controlled variation**.

A representative flow might be:

```text
START
  ↓
Introduction
  ↓
Resume / Profile
  ↓
Candidate-specific exploration
  ↓
Consulting / Case
  ↓
AI
  ↓
Behavioral
  ↓
Closing
```

But this should not be fixed.

Possible alternative:

```text
Resume
  ↓
Internship
  ↓
Case
  ↓
AI
  ↓
Project
  ↓
HR
```

Another:

```text
Introduction
  ↓
Project
  ↓
Technical
  ↓
AI
  ↓
Case
  ↓
Behavioral
```

The system should select trajectories based on observed patterns and candidate context.

---

# 23. Deterministic vs Probabilistic Behavior

## Mostly deterministic

- Approximate interview duration
- Broad interview objectives
- Professional tone
- Use of candidate resume
- One question at a time
- Natural closing
- Avoiding repeated questions

## Probabilistic

- Exact question
- Exact topic order
- Case vs no case
- AI question selection
- Behavioral question selection
- Depth of probing
- Topic transitions

## Dynamic

- Follow-up questions
- Reaction to candidate answers
- Whether to challenge
- Whether to ask for examples
- Whether to ask for quantification
- Whether to pursue a resume claim
- When to move on

The balance is:

> **Consistent interview identity + variable interview trajectory.**

---

# 24. Live Interview State

The live LLM should maintain an explicit interview state.

The model should have access to:

```text
Time elapsed
Time remaining

Current section
Current objective

Completed sections

Questions already asked

Candidate answers

Important candidate claims

Unexplored resume items

Recent conversation

Potential follow-up triggers

Relevant historical Accenture patterns

Current interviewer persona

Interview difficulty state

Next-question constraints
```

Example:

```text
INTERVIEW STATE

Time elapsed: 14:32

Current section:
Resume → Internship

Sections completed:
Introduction
Resume
Project

Current objective:
Assess ownership and business impact

Candidate claims:
- Reduced processing time by 40%
- Led 5-person team
- Built RAG system

Unexplored claims:
- 40% improvement
- Team leadership

Relevant historical patterns:
...

Interviewer style:
Professional
Conversational
Probing
Manager-level

Next-question constraints:
- Ask one question
- Prefer a follow-up on the previous answer
- Avoid repetition
- Maintain natural conversation
```

This state should be updated after every turn.

---

# 25. Resume-Aware Branching

Resume-aware behavior is one of the most important parts of the simulation.

Before starting the interview, the system should identify:

- Major experiences
- Important metrics
- Technologies
- Leadership claims
- Business impact claims
- Unusual achievements
- AI/ML experience
- Consulting experience
- Internships
- Projects

The interviewer can then naturally probe them.

Example:

```text
Resume:
“Reduced processing time by 40%.”

        ↓

Interviewer:
“How did you measure that 40%?”

        ↓

Candidate explains

        ↓

“How did you establish the baseline?”

        ↓

“What was your personal contribution?”

        ↓

“How did this affect the business?”

        ↓

Potential transition into business problem solving
```

The system should track which resume items have already been explored.

---

# 26. Interviewer Behavior Model

The interviewer should feel like a manager-level or senior interviewer, not a generic chatbot.

Potential observed characteristics:

- Professional
- Conversational
- Concise
- Curious
- Probing
- Challenging when necessary
- Does not praise every answer
- Does not explain why every question is being asked
- Can move quickly when satisfied
- Can drill deeply when an answer is interesting
- Can ask “why?”
- Can ask “how?”
- Can request examples
- Can request quantification
- Can challenge assumptions
- Can revisit earlier claims
- Can transition naturally

The interviewer should not behave artificially by saying things like:

> “Great answer!”

after every response.

---

# 27. Candidate Answer → Follow-up Logic

The system should identify candidate signals.

Examples:

### Quantitative claim

Candidate:

> “I increased revenue by 30%.”

Potential interviewer behavior:

> “How did you measure the 30%?”

### Technical claim

Candidate:

> “I built a RAG pipeline.”

Potential behavior:

> “Why did you choose RAG rather than fine-tuning?”

### Leadership claim

Candidate:

> “I led a five-person team.”

Potential behavior:

> “Tell me about a disagreement within the team.”

### Weak/general answer

Potential behavior:

> Ask for a concrete example.

### Strong/interesting answer

Potential behavior:

> Probe deeper.

### Unsupported claim

Potential behavior:

> Challenge or request evidence.

This is how the interview becomes dynamic.

---

# 28. AI/GenAI Interview Layer

AI should be treated as a first-class category because current observations indicate that AI-related questions may be part of the Accenture consulting interview.

However, the exact prevalence must be learned from the dataset.

Potential dimensions:

- AI fundamentals
- ML concepts
- Generative AI
- LLMs
- RAG
- Agents
- AI applications
- AI strategy
- AI transformation
- Implementation
- AI limitations
- Risk/ethics
- Business adoption
- Explaining AI to non-technical stakeholders
- AI + consulting

The system should distinguish:

> Technical AI assessment

from:

> Business/consulting AI assessment.

This distinction should be data-driven.

---

# 29. Case / Consulting Layer

Cases should be stored as structured problems.

Each case should contain:

```text
case_type
initial_problem
information_provided
information_revealed_later
calculations
assumptions
expected_reasoning
common_mistakes
interviewer_hints
interviewer_challenges
resolution
```

Possible categories:

- Profitability
- Market entry
- Market sizing
- Growth
- Operations
- Strategy
- Pricing
- Digital transformation
- AI transformation
- Other

The system should not force a textbook consulting framework unless real interview evidence supports that style.

---

# 30. Preparation Mode vs Interview Mode

The product should conceptually separate:

## Guided preparation

Before the interview:

- Explain broad interview areas
- Explain duration
- Explain that resume will matter
- Give preparation context

## Realistic simulation

During the interview:

- No coaching
- No hints unless naturally appropriate
- Dynamic questions
- Dynamic follow-ups
- Realistic interviewer behavior
- No hidden rubric disclosure

## Detailed feedback

After the interview:

- Score
- Explain strengths
- Explain weaknesses
- Give preparation recommendations
- Identify likely areas requiring additional preparation

---

# 31. Post-Interview Evaluation

Potential evaluation dimensions:

- Overall Accenture readiness
- Resume discussion
- Communication
- Structured problem solving
- Consulting/business thinking
- Case performance
- AI understanding
- Behavioral/fit responses
- Ownership of experience
- Ability to defend claims
- Executive/professional presence

Feedback should always reference actual candidate answers.

Example:

> “Your project explanation was technically strong, but you did not clearly establish the business impact.”

rather than:

> “Improve your project answers.”

---

# 32. Important Product Guardrails

The feature should follow these principles:

1. Never claim that a question is guaranteed to appear.
2. Preserve source provenance.
3. Preserve confidence.
4. Do not expose one candidate's private information to another.
5. Remove unnecessary personal information from collected experiences.
6. Treat interview recollections as evidence, not absolute truth.
7. Do not allow one anecdote to dominate the model.
8. Prefer current-year same-role evidence when detecting changing patterns.
9. Keep the data layer separate from the live interviewer prompt.
10. Make the knowledge base independently updateable.
11. Avoid repetitive questions.
12. Avoid deterministic scripts.
13. Do not reveal hidden evaluation criteria during the interview.
14. Do not overstate the realism as a guarantee of the actual interview.
15. Validate the simulator against recent real interviewees.

---

# 33. Validation Framework

The feature should be evaluated primarily on **realism**, not just question quality.

Questions to test:

### Interview flow

Does the simulated flow resemble actual Accenture interviews?

### Question relevance

Are questions plausible for the role and candidate?

### Follow-up realism

Do follow-ups naturally arise from candidate answers?

### Resume usage

Does the interviewer use the resume naturally?

### Interviewer behavior

Does the system feel like a manager-level interviewer?

### Current-year relevance

Are current-cycle patterns represented?

### Variation

Do different candidates get different but plausible trajectories?

### Pacing

Does the interview naturally fit approximately 20–30 minutes?

### Recognition test

Have recent Accenture interviewees evaluate:

> “Does this feel like a plausible Accenture interview?”

This is one of the strongest validation mechanisms.

---

# 34. Development Roadmap

## Phase 0 — Data Collection

- Deploy short historical form.
- Contact IITB batchmates.
- Contact current-year IIT students.
- Expand to additional IITs where possible.
- Establish immediate post-interview debrief process.

## Phase 1 — Data Normalization

- Define schema.
- Define taxonomy.
- Define evidence model.
- Manually process initial interviews.
- Validate extraction quality.

## Phase 2 — AI Preprocessing Pipeline

Automate:

- Cleaning
- Segmentation
- Classification
- Question extraction
- Follow-up extraction
- Interviewer behavior extraction
- Transition extraction
- Semantic clustering
- Frequency calculation
- Confidence assignment

## Phase 3 — Knowledge Base

Build:

- Question records
- Follow-up patterns
- Interview trajectories
- Section probabilities
- Interviewer behaviors
- Case patterns
- AI patterns
- Candidate triggers

## Phase 4 — Live Accenture Interview Engine

Integrate:

- Accenture interviewer persona
- Interview state
- Historical retrieval
- Resume intelligence
- Probabilistic flow
- Dynamic follow-ups
- Time-aware transitions

## Phase 5 — Evaluation

Build:

- Accenture-specific scoring
- Readiness report
- Candidate-specific feedback
- Preparation recommendations

## Phase 6 — Validation

Test with:

- Students
- Recent interviewees
- IITB candidates
- Other current-year candidates

Compare:

> Simulated experience vs real interview experience.

## Phase 7 — Continuous Updating

Continue collecting current-year experiences.

Update:

- Question frequency
- Flow patterns
- AI patterns
- Case patterns
- Interviewer behavior
- Confidence
- Recency

---

# 35. Recommended Initial Sample Size

A practical target:

### IITB historical

5–15 detailed interviews.

### Current-year IIT interviews

10–20 interviews if possible.

### Total

20–30 well-reconstructed interviews would already be useful.

30–50 would be excellent.

The important point is:

> **Quality of reconstruction matters more than raw number of interviews.**

A detailed chronological interview with question → answer → follow-up information is much more valuable than 50 people simply listing five questions each.

---

# 36. Recommended Repository-Level Architecture

The existing project architecture should be reused rather than duplicated.

Conceptually, the Accenture layer can be separated into:

```text
data_collection
    ↓
data_pipeline
    ↓
knowledge_base
    ↓
resume_intelligence
    ↓
interview_engine
    ↓
interviewer_persona
    ↓
evaluation
    ↓
analytics
```

Responsibilities:

### data_collection

Raw interview experiences and imported source material.

### data_pipeline

Cleaning, extraction, normalization and aggregation.

### knowledge_base

Structured Accenture interview intelligence.

### resume_intelligence

Candidate-specific interview triggers.

### interview_engine

Live interview state, branching and pacing.

### interviewer_persona

Accenture-specific manager-level interviewer behavior.

### evaluation

Post-interview scoring and feedback.

### analytics

Simulation quality and usage metrics.

The exact implementation should follow the existing Internprep.AI codebase.

---

# 37. Reusable Future Architecture

Although Accenture is the first deeply modeled company/role, the architecture should eventually support:

```text
Company
    +
Role
    +
Recruitment Cycle
    ↓
Interview Knowledge Base
    ↓
Company-Specific Interviewer
    ↓
Candidate Resume
    ↓
Live Simulation
    ↓
Company-Specific Evaluation
```

Therefore, avoid hardcoding the entire architecture around Accenture.

Accenture should initially be the **first high-quality implementation of a reusable company-specific interview framework**.

---

# 38. Immediate Next Steps

The immediate sequence should be:

1. Create and distribute the short Accenture Interview Experience Form.
2. Identify 5–15 IITB batchmates for detailed conversations.
3. Reach out to IITD, IITM, IITKGP, IIT Dhanbad and additional IIT contacts.
4. Ask current-year candidates to complete the debrief immediately after their interviews.
5. Store raw responses separately from processed data.
6. Process the first 5–10 interviews manually.
7. Refine the taxonomy based on actual evidence.
8. Finalize the structured interview schema.
9. Build the AI preprocessing pipeline.
10. Generate the first Accenture knowledge base.
11. Integrate the knowledge base with the existing interview engine.
12. Add explicit live interview state.
13. Add resume-aware branching.
14. Add Accenture-specific interviewer behavior.
15. Add Accenture-specific evaluation.
16. Test realism with recent Accenture interviewees.
17. Iterate using new interview data.

---

# 39. Core Principle for Antigravity / AI Coding Agent

The central implementation principle is:

> **Do not build an Accenture question bank. Build an evidence-backed Accenture interview intelligence layer.**

The existing Internprep.AI interview engine should remain the foundation.

The new Accenture feature should primarily add:

```text
Accenture Data
      ↓
Accenture Knowledge Base
      ↓
Accenture Interview State
      +
Candidate Resume
      ↓
Dynamic Interview
      ↓
Accenture Evaluation
```

The AI coding agent should preserve the distinction between:

- Generic interview infrastructure
- Company-specific knowledge
- Company-specific interviewer behavior
- Candidate-specific information
- Live conversation state
- Evaluation logic

The preferred approach is:

> **Collect → Normalize → Extract → Validate → Aggregate → Retrieve → Simulate → Evaluate**

The system should prioritize **realism, evidence quality, current-year relevance, and natural branching** over simply increasing the number of questions.

A smaller set of highly reliable interview trajectories with strong stateful branching is preferable to a large unstructured question bank.

---

# 40. Final Product Vision

The eventual student experience should feel approximately like this:

```text
Student selects:
Accenture
Management Consulting
Summer Internship

        ↓

Student selects resume

        ↓

System analyzes resume

        ↓

Accenture Interviewer initialized

        ↓

20–30 minute simulation

        ↓

Introduction
        ↓
Resume
        ↓
Candidate-specific questions
        ↓
Dynamic follow-ups
        ↓
Case / Business problem
        ↓
AI / GenAI
        ↓
Behavioral
        ↓
Closing

        ↓

Accenture Readiness Report
        ↓
Strengths
        ↓
Weaknesses
        ↓
Specific answer feedback
        ↓
Topics to prepare
        ↓
Recommended next practice
```

The critical difference from a generic mock interview is that the interviewer should continuously reason about:

> **“Given this candidate's resume, what they have already said, how they answered the previous question, the time remaining, and what real Accenture interviews have historically looked like, what would a realistic interviewer ask next?”**

That is the core intelligence this feature should eventually provide.

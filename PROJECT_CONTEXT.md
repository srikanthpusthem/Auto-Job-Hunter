# Project Context — Auto-Job-Hunter

Auto-Job-Hunter is a multi-agent AI SaaS tool built with LangGraph, Groq, FastAPI, React, MongoDB, and n8n.

---

## Purpose

The system:

1. Scans multiple job platforms:
   - Google Jobs (SerpAPI)
   - YC Jobs
   - Wellfound/AngelList
   - Indeed (scraping)
   - LinkedIn (Playwright automation)
2. Normalizes job listings.
3. Matches jobs to user skills using:
   - embeddings
   - LLM reasoning (Groq + GPT-4.1-mini)
4. Generates outreach content:
   - Email body + subject
   - LinkedIn DM text
5. Sends email content to n8n → Gmail Draft Creation.
6. Stores only **matched jobs** in MongoDB.
7. Provides a React dashboard with:
   - job list
   - scores
   - outreach preview
   - "create Gmail draft" actions.

---

## Core Agents (LangGraph)

- **SupervisorAgent**  
  Decides sources + match thresholds.

- **ScoutAgent**  
  Calls tools: SerpAPI, Playwright, HTTP scrapers.

- **JobNormalizerAgent**  
  Converts raw job data into unified schema.

- **ResumeProfilerAgent**  
  Extracts skills/experience from user profile.

- **MatchingAgent**  
  Performs embeddings + reasoning-based scoring.

- **OutreachAgent**  
  Generates email + DM templates.

- **ReviewerAgent**  
  Final cleanup + dedup + write to DB.

---

## Backend Architecture

- FastAPI async server
- LangGraph runtime inside backend
- Celery + Redis for scheduled runs
- MongoDB for:
  - users
  - scan_runs
  - matched_jobs

---

## Frontend Architecture

- React (Vite)
- Tailwind + shadcn
- TanStack Query
- Clerk for authentication
- Components:
  - Dashboard
  - Matched Jobs
  - Outreach Preview Modal
  - Profile Settings

---

## Automation Layer (n8n)

Used for:

- Gmail draft creation
- Logging to Google Sheets/Notion (optional)

Webhook receives:

```json
{
  "job_id": "...",
  "email_subject": "...",
  "email_body": "...",
  "to_email": "...",
  "user_email": "...",
  "job_metadata": {...}
}
```

# System Architecture — Auto-Job-Hunter

This document defines the complete system architecture, including backend, agents, frontend, database, and automation.

---

## High-Level Architecture

[React Frontend]
|
| --> Clerk Auth
|
[FastAPI Backend] ----> [LangGraph Runtime] ----> [Groq LLM + Tools]
|
v
[MongoDB Atlas]
|
v
[n8n Webhook] --> Gmail Draft Creation

---

## Backend Components

### **FastAPI (Layered Architecture)**

- **API Layer** (`backend/app/api/`):
  - Thin controllers that handle HTTP requests and responses.
  - Routes: `/api/jobs`, `/api/users`, `/api/runs`, `/api/dashboard`.
- **Service Layer** (`backend/app/services/`):
  - Contains all business logic.
  - Orchestrates interactions between DB, Agents, and External APIs.
  - Services: `JobService`, `UserService`, `RunService`, `DashboardService`.
- **Repository Layer** (`backend/app/db/repositories/`):
  - Handles all database interactions.
  - Repositories: `JobRepository`, `UserRepository`, `RunRepository`.

### **LangGraph**

- Located in `backend/app/agents/`.
- Agents:
  1. SupervisorAgent
  2. ScoutAgent
  3. JobNormalizerAgent
  4. ResumeProfilerAgent
  5. MatchingAgent
  6. OutreachAgent
  7. ReviewerAgent

State contains:

- user profile
- search filters
- raw jobs
- normalized jobs
- matched jobs
- outreach payloads

### **MongoDB**

- Models defined in `backend/app/db/models.py`.
- Collections:
  - `users`
  - `scan_runs`
  - `matched_jobs`
  - `run_logs`

### **Celery + Redis**

- Handles background job scans for:
  - daily schedule (triggered by n8n or Cron)
  - user-triggered scans

---

## Frontend Architecture

### **React (Vite)**

Pages:

- Dashboard
- Matched Jobs
- Outreach Preview
- Profile Settings
- Login (Clerk)

State Management:

- Zustand for global app state
- TanStack Query for backend fetching

UI:

- TailwindCSS + shadcn UI components

---

## Automation Architecture (n8n)

Purpose:

- Gmail Draft Creation
- Logging to Google Sheets / Notion (optional)

Workflow:

Webhook → Gmail Node → (optional) Google Sheets → Response

Payload passed from backend includes:

- job metadata
- outreach email
- user email
- target recruiter email

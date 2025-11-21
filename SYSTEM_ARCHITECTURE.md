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

### **FastAPI**

- Hosts API routes for:
  - job scanning
  - profile management
  - outreach actions
  - run history
- Integrates with Clerk JWT for authentication.
- Triggers LangGraph runs.

### **LangGraph**

Agents:

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

Collections:

- `users`
- `scan_runs`
- `matched_jobs`

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

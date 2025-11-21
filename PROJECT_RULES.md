# Project Rules — Auto-Job-Hunter

These are the global rules Anti-Gravity must follow across the entire project.

---

## 1. Code Style & Language

- Use **Python 3.10+** for backend.
- Backend framework: **FastAPI** with async endpoints.
- Agent framework: **LangGraph** only.
- LLM runtime: **Groq** for fast loops; fallback to **GPT-4.1-mini** for heavy reasoning.
- Models: **pydantic v2**.
- Database: **MongoDB** with `motor` async driver.
- Use strong typing everywhere.

---

## 2. Folder Structure

Anti-Gravity must always follow:

backend/
app/
api/
agents/
agents/prompts/
db/
workers/
core/
utils/
frontend/
src/
components/
pages/
hooks/
services/
automation/
n8n/
scripts/

No new folders should be created unless explicitly asked.

---

## 3. Implementation Preferences

- Prefer **composition** over inheritance.
- Business logic lives in `services/` or `core/`, not route files.
- All LangGraph prompts stored in `agents/prompts/`.
- All environment variable access via `core/config.py`.
- Use **tool calling** for job scraping, not inline code.
- All scraping is isolated under `agents/tools_sources.py`.

---

## 4. Code Generation Rules

- All functions must be:
  - small
  - single-responsibility
  - typed
  - documented
- All LLM calls go through `agents/llm_client.py`.
- For React:
  - Functional components
  - TanStack Query for data fetching
  - Zustand for global state
  - Tailwind + shadcn for UI styling

---

## 5. LLM & Agent Rules

- Always use async Groq SDK.
- LangGraph nodes must use:
  - deterministic prompts
  - structured JSON outputs
  - retry with exponential backoff
- State must be defined as a TypedDict or pydantic model.
- No uncontrolled long prompts.

---

## 6. n8n Rules

- n8n workflows live in `/automation/n8n/`.
- Only **Gmail draft creation** is automated.
- All payload examples must be documented in `webhooks.md`.

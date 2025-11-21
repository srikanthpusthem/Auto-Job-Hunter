# Folder Structure — Auto-Job-Hunter

This document defines the required folder structure for the project.
Anti-Gravity must follow this structure exactly unless told otherwise.

---

## Root Structure

/
backend/
frontend/
automation/
scripts/
README.md

---

## Backend Structure

backend/
app/
main.py
api/ # Route Handlers (Thin Controllers)
jobs/
routes.py
users/
routes.py
runs/
routes.py
dashboard/
routes.py
services/ # Business Logic
job_service.py
user_service.py
run_service.py
dashboard_service.py
db/ # Database Layer
models.py
mongo.py
repositories/
base_repository.py
user_repository.py
job_repository.py
run_repository.py
agents/ # LangGraph Agents
graph.py
llm_client.py
supervisor.py
scout.py
normalizer.py
profiler.py
matcher.py
outreach.py
reviewer.py
tools_sources.py
normalization_utils.py
scraper_utils.py
prompts/
supervisor.txt
scout.txt
normalizer.txt
profiler.txt
matcher.txt
outreach.txt
reviewer.txt
core/
config.py
logging.py
security.py
utils/
hashing.py
time_utils.py
formatters.py

---

## Frontend Structure

frontend/
src/
components/
dashboard/
AgentStatus.jsx
AgentTimeline.jsx
jobs/
JobCard.jsx
KanbanBoard.jsx
JobDetailModal.jsx
ui/ # shadcn components
pages/
Dashboard.jsx
JobsPage.jsx
ProfilePage.jsx
Settings.jsx
Login.jsx
hooks/
useStartRun.js
useStopRun.js
services/
apiClient.js
runService.js
jobService.js
userService.js
store/
userStore.js
styles/
globals.css

---

## Automation Structure (n8n)

automation/
n8n/
webhooks.md
gmail_draft_workflow.json
README.md

---

## Scripts

scripts/
dev_setup.sh
deploy_backend.sh
deploy_frontend.sh

---

## Rules

- Anti-Gravity must adhere strictly to this structure.
- No new folders may be created unless I explicitly request them.
- All LangGraph prompts must live in `backend/app/agents/prompts/`.
- All scraping logic must be inside `backend/app/agents/tools_sources.py` or dedicated modules.

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
core/
config.py
logging.py
security.py
api/
routes_jobs.py
routes_runs.py
routes_profile.py
routes_outreach.py
init.py
agents/
graph.py
llm_client.py
prompts/
supervisor.txt
scout.txt
normalizer.txt
profiler.txt
matcher.txt
outreach.txt
reviewer.txt
init.py
tools_sources.py
matchers.py
db/
mongo.py
models.py
repositories.py
init.py
workers/
celery_app.py
tasks.py
playwright/
linkedin_scraper.py
indeed_scraper.py
init.py
utils/
hashing.py
time_utils.py
formatters.py

---

## Frontend Structure

frontend/
src/
components/
JobCard.jsx
MatchBadge.jsx
OutreachModal.jsx
pages/
Dashboard.jsx
Login.jsx
Profile.jsx
hooks/
useUserProfile.js
useJobScan.js
services/
apiClient.js
jobService.js
profileService.js
store/
userStore.js
jobStore.js
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
- All LangGraph prompts must live in `agents/prompts/`.
- All scraping logic must be inside `workers/playwright/`.

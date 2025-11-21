---
trigger: always_on
---

# AUTO-JOB-HUNTER — MASTER WORKSPACE RULES

These rules apply to ALL file generations, edits, refactors, and updates in this workspace. 
Follow these constraints STRICTLY to maintain project stability, correctness, and scalability.

====================================================
ARCHITECTURAL PRINCIPLES (MANDATORY)
====================================================

Use Domain-Driven Design (DDD) throughout the backend:

ROUTE (Thin Controller)
→ SERVICE (Business Logic)
→ REPOSITORY (Database Access)
→ SCHEMA/MODEL (Pydantic)
→ AGENT (LangGraph nodes & tools)
→ UTILS (Shared helpers)

Rules:
- NO business logic inside routes.
- NO direct database access inside services.
- NO mixing AI logic with routing or DB code.
- NO cross-domain code leakage.
- NO creating new folders unless explicitly requested.

Allowed backend domains:
    agents/
    jobs/
    outreach/
    user/
    automations/
    system/

====================================================
FOLDER RULES (NEVER BREAK THESE)
====================================================

backend/app/api/<domain>/<file>.py      # routes
backend/app/services/<domain>_service.py # business logic
backend/app/db/repositories/<domain>_repository.py
backend/app/db/models.py                # schemas
backend/app/agents/                     # LangGraph
backend/app/agents/tools/               # scrapers, APIs
backend/app/agents/prompts/             # LLM prompts
backend/app/utils/                      # helpers

frontend/src/pages/
frontend/src/components/
frontend/src/services/
frontend/src/store/

DO NOT create new folders unless explicitly asked.

====================================================
ROUTE LAYER RULES
====================================================

Routes must:
- contain ZERO business logic.
- call exactly one service function.
- validate input via pydantic.
- be fully async.

Routes SHOULD NOT:
- touch repositories
- call agents directly
- contain try/except beyond simple error forwarding

====================================================
SERVICE LAYER RULES
====================================================

Services must:
- contain all business logic.
- orchestrate DB + agents + external tools.
- remain pure, focused, modular.
- use repositories for DB actions.
- NEVER contain direct Motor/Mongo calls.

Services SHOULD NOT:
- rewrite schemas
- change domain responsibilities
- modify unrelated modules

====================================================
REPOSITORY LAYER RULES
====================================================

Repositories must:
- contain all database operations.
- return clean dictionaries or pydantic models.
- never include business logic.
- never call agents or services.

Repositories SHOULD NOT:
- be aware of AI workflows
- contain branching logic

====================================================
AGENT LAYER RULES (LangGraph)
====================================================

Agents must:
- live exclusively inside backend/app/agents/
- follow the existing state definition
- use separate files for each node
- keep prompts under backend/app/agents/prompts/
- expose tools only under backend/app/agents/tools/

Agents SHOULD NOT:
- modify databases directly
- call FastAPI routes
- be aware of UI or frontend logic

====================================================
MULTI-FILE UPDATE RULE (CRITICAL)
====================================================

When updating multiple files:
1. Identify EXACT files that MUST change.
2. Output them as: "Files to Modify" and "Files to Create".
3. WAIT for confirmation before generating code.
4. Update ONLY those files.

DO NOT:
- modify unrelated files
- refactor the entire backend
- rewrite components unless requested
- rename existing folders

====================================================
SAFE SCOPE RULES (Use Always)
====================================================

Before generating any code, Anti-Gravity must:

1. Review the current project structure.
2. Confirm the domain of the requested change.
3. Confirm all affected files.
4. Wait for approval BEFORE writing code.
5. Restrict changes to ONLY the approved files.

====================================================
FRONTEND RULES
====================================================

Frontend updates MUST:
- only affect the files explicitly listed.
- NOT modify global layout, routing, or unrelated components.
- follow existing Tailwind + shadcn style.
- use zustand & TanStack Query patterns.

====================================================
SCHEMA & MODEL RULES
====================================================

- All schemas must use pydantic v2.
- All job objects must follow the unified JobSchema.
- DO NOT alter schema formats without explicit instruction.
- DO NOT break backward compatibility accidentally.

====================================================
UTILS & HELPERS RULE
====================================================

- Put reusable helpers into /utils.
- NEVER place business logic in utils.

====================================================
FEATURE FLAG RULE
====================================================

If adding new features, implement behind flags in:
backend/app/core/feature_flags.py

Do NOT activate features unless asked.

====================================================
DEPLOYMENT-SAFE RULE
====================================================

NEVER:
- introduce breaking changes across domains
- remove endpoints
- alter DB collection names
- modify credentials or environment variables

====================================================
FINAL EXECUTION RULE
====================================================

Anti-Gravity MUST obey:

- NO over-engineering
- NO expanding the scope
- NO optimizing unrelated code
- NO auto-refactoring outside requested modules
- NO generating excessive boilerplate
- NO rewriting the entire project

Focus ONLY on the requested feature and the approved files.

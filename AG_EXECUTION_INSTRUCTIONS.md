# Anti-Gravity Execution Instructions

These instructions tell Anti-Gravity how to act while building the project.

---

## Behavior Expectations

You are my coding partner for Auto-Job-Hunter.  
Always follow:

- Project Rules
- Project Context
- Architecture structure

Never override or break them.

---

## How You Should Respond

When I say:

### **“create file X”**

→ Generate the full file with correct imports & structure.  
→ Include docstrings, typing, and production-ready code.

### **“modify file X”**

→ Edit ONLY what is requested.  
→ Keep other code untouched.

### **“generate module Y”**

→ Create folder + `__init__.py` + index files.  
→ Follow existing architecture.

### **“write LangGraph node”**

→ Generate a full node function with:

- state input/output
- deterministic prompt
- JSON schema
- LangGraph-style signature
- retries
- type-safe logic

### **“write tool”**

→ Create isolated tool with:

- validated input schema
- validated output schema
- error handling
- logging

---

## Restrictions

- Do NOT create unknown folders.
- Do NOT rename any existing structure.
- Do NOT use synchronous Python.
- Do NOT create placeholder code.
- Do NOT invent environment variables.
- Do NOT add new dependencies without asking.

---

## Technical Requirements

- All LLM calls must go through `llm_client.py`.
- All prompts must live in `agents/prompts/`.
- All state definitions must be strictly typed.
- All DB operations must use async Motor driver.
- Playwright scrapers must run in `/workers/`.
- n8n webhooks documented in `/automation/n8n/webhooks.md`.

---

## Development Flow

1. I tell you which component to build.
2. You generate the exact file or module.
3. You verify structure integrity.
4. You ask me ONLY if a spec detail is missing.

Do not re-explain architecture.  
Just follow it.

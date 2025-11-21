# LangGraph Design — Auto-Job-Hunter

This file describes the LangGraph agent architecture, state design, node responsibilities, and tool interfaces.

---

## State Definition

Using TypedDict or Pydantic:

```python
{
  "user_profile": {...},
  "search_query": {...},
  "raw_jobs": [],
  "normalized_jobs": [],
  "matched_jobs": [],
  "outreach_payloads": [],
  "errors": [],
  "run_meta": {
    "trigger": "manual" | "daily",
    "started_at": "",
    "sources_used": []
  }
}
```

## Agents & Responsibilities

### 1. SupervisorAgent

- Reads user profile & search filters.
- Decides:
  - which job sources to query
  - minimum match threshold
- Outputs configuration into `run_meta`.

### 2. ScoutAgent

- Uses tools:
  - `search_google_jobs_serpapi`
  - `search_indeed_playwright`
  - `search_linkedin_playwright`
  - `fetch_yc_jobs`
  - `fetch_wellfound_jobs`
- Collects all raw jobs → `raw_jobs`.

### 3. JobNormalizerAgent

- Converts raw job objects from multiple formats into a unified schema.
- Ensures fields:
  - `id`
  - `title`
  - `company`
  - `location`
  - `remote` flag
  - `apply_url`
  - `tags`
  - `description`

### 4. ResumeProfilerAgent

- Extracts skills and experience from:
  - uploaded resume
  - user profile
- Updates `user_profile.skills` etc.

### 5. MatchingAgent

- Embeddings via Groq / Instructor models
- Similarity scoring
- LLM-powered reasoning score
- Outputs `matched_jobs`.

### 6. OutreachAgent

- Generates:
  - email subject
  - email body
  - LinkedIn DM body
- Stores results in `outreach_payloads`.

### 7. ReviewerAgent

- Cleans duplicates using fingerprints
- Removes jobs already applied recently
- Sets final job entries

## Graph Flow

Supervisor → Scout → Normalizer → Profiler → Matcher → Outreach → Reviewer → END

## Tool Rules

- All tools must be async.
- All tools must have validated input & output.
- All scraping must be handled in separate modules.

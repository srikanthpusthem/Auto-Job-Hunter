# End‑to‑End Documentation for Auto‑Job‑Hunter

## Overview

This document describes the complete workflow and code changes introduced to implement a **production‑ready unified job schema** across the entire Auto‑Job‑Hunter system. It is intended for future developers and agents to understand the architecture, data flow, and repository setup.

---

## 1. Unified Job Schema

The new schema is defined in `backend/db/models.py` as the `Job` Pydantic model. Key components:

- **Core fields**: `id`, `source`, `source_id`, `title`, `company`, `company_logo`, `location`, `remote`, `job_type`, `employment_type`.
- **SalaryInfo**: nested model with `min`, `max`, `currency`, `interval`.
- **Metadata**: `collected_at`, `scraped_from`, `fingerprint`, `raw_payload`.
- **OutreachContent**: `email_subject`, `email_body`, `linkedin_dm`.
- **Additional enrichment**: `tags`, `skills_extracted`, `match_score`, `match_reasoning`, `missing_skills`.
- Validation rules enforce that at least one of `listing_url` or `apply_url` is present; otherwise the job is discarded.

---

## 2. Scraper (ScoutAgent) Enhancements

All scraper functions in `backend/agents/tools_sources.py` were updated to extract the full set of fields required by the schema:

- **SerpAPI (Google Jobs)** – extracts `listing_url`, `apply_url`, `source_id`, `company_logo`, `salary`, `posted_at`, `description`.
- **LinkedIn (Playwright)** – extracts job URL, company logo, full description, posted date, and sets `apply_url = listing_url`.
- **Indeed (Playwright)** – extracts job ID, URLs, company logo, salary snippet, posted date.
- **YC & Wellfound** – similar enrichment (not shown here but updated accordingly).
  Each scraper now returns a list of dictionaries matching the unified schema keys.

---

## 3. Normalizer Agent

- Added `backend/agents/normalization_utils.py` with deterministic helper functions:
  - `normalize_company_name`, `normalize_title`
  - `parse_salary`, `parse_posted_date`
  - `extract_tags`, `extract_skills`
  - `generate_fingerprint`, `is_valid_job`
- `backend/agents/normalizer.py` now:
  1. Calls the LLM to produce a preliminary normalized payload.
  2. Runs the Python utilities to enforce strict validation, fill defaults, compute fingerprint, and attach `metadata.raw_payload`.
  3. Discards jobs missing required URLs.
  4. Returns a list of fully‑validated `Job` objects ready for persistence.

---

## 4. Repository Layer

- **Location**: `backend/app/db/repositories/`.
- **Structure**: Split into dedicated repositories:
  - `JobRepository`: Handles job CRUD and deduplication (`find_by_fingerprint`).
  - `UserRepository`: Handles user profile data.
  - `RunRepository`: Handles scan run history.
- **Models**: Defined in `backend/app/db/models.py`, including nested `SalaryInfo`, `OutreachContent`, and `JobMetadata`.

---

## 5. Matcher & Outreach Agents

- **Matcher** (`backend/agents/matcher.py`) now includes `skills_extracted` and `missing_skills` in the output and logs the number of missing skills.
- **Outreach** (`backend/agents/outreach.py`) populates the nested `outreach` fields on the `Job` model.

---

## 6. API Endpoints

- **Location**: `backend/app/api/`.
- **Structure**: Organized by domain (`jobs`, `users`, `runs`, `dashboard`).
- **Logic**: All business logic has been moved to the **Service Layer** (`backend/app/services/`).
- **Response Schema**: Returns the unified `Job` model shape (including nested objects) to the frontend.

---

## 7. Frontend Adjustments

- `frontend/src/pages/JobsPage.jsx` now displays:
  - Company logo images
  - Tags as badges
  - Salary range (if present)
  - “Apply” and “View Listing” buttons linking to the correct URLs.
- No major UI redesign, only data‑binding updates.

---

## 8. Repository Clean‑up & Git History

- Added a `.gitignore` to exclude virtual‑environment directories and large binaries.
- Removed the `backend/venv` folder from the repository (large files caused GitHub LFS rejection).
- Re‑initialized the Git repository, staged all files, and created a clean initial commit (`68cb99e`).
- Pushed the commit to GitHub: `https://github.com/srikanthpusthem/Auto-Job-Hunter`.

---

## 9. Verification & Testing

- **Scraper tests** (`scripts/test_scrapers.py`) verify each scraper returns the enriched fields.
- **Normalizer test** (`scripts/test_normalizer_schema.py`) checks schema compliance, fingerprint generation, and discarding of invalid jobs.
- **Full pipeline test** (`scripts/test_full_flow.py`) runs a complete scan and confirms jobs are stored in MongoDB with the new schema.
- Manual UI verification confirms the frontend renders the new fields correctly.

---

## 10. Future Work & Maintenance

- **CI/CD**: Add GitHub Actions to run the test suite on each push.
- **Schema migrations**: If the project already has production data, run `scripts/migrate_job_schema.py` to convert old documents.
- **LFS**: Any future large binary assets should be tracked with Git LFS.
- **Agent extensions**: New agents can rely on the `normalization_utils` helpers for any additional data enrichment.

---

_Prepared by the Antigravity coding assistant on 2025‑11‑20._

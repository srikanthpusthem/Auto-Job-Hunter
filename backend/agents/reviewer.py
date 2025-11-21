import json
import os
import asyncio
from backend.agents.graph import AgentState
from backend.agents.llm_client import llm_client
from backend.db.mongo import get_database
from backend.db.repositories import JobRepository

async def reviewer_node(state: AgentState):
    print("--- Reviewer Agent ---")
    matched_jobs = state.get("matched_jobs", [])
    
    if not matched_jobs:
        print("No jobs to review.")
        return {"matched_jobs": []}
    
    # Deduplication using fingerprint (more reliable than ID)
    db = await get_database()
    repo = JobRepository(db)
    
    final_jobs = []
    for job in matched_jobs:
        # Check for duplicate using fingerprint
        existing = await repo.find_by_fingerprint(job.metadata.fingerprint)
        if not existing:
            # Save to DB
            await repo.create(job.model_dump(by_alias=True))
            final_jobs.append(job)
        else:
            print(f"Duplicate job found by fingerprint: {job.metadata.fingerprint} (job: {job.title} at {job.company})")
            
    print(f"Reviewer approved and saved {len(final_jobs)} new jobs.")
    
    return {"matched_jobs": final_jobs}

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
    
    # Simple deduplication logic (check if job ID already exists in DB)
    db = await get_database()
    repo = JobRepository(db)
    
    final_jobs = []
    for job in matched_jobs:
        existing = await repo.find_one({"_id": job.id})
        if not existing:
            # Save to DB
            await repo.create(job.model_dump(by_alias=True))
            final_jobs.append(job)
        else:
            print(f"Duplicate job found: {job.id}")
            
    print(f"Reviewer approved and saved {len(final_jobs)} new jobs.")
    
    return {"matched_jobs": final_jobs}

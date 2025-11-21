from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from backend.db.mongo import get_database
from backend.db.repositories import JobRepository, UserRepository
from backend.db.models import Job
import asyncio

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

class ScanRequest(BaseModel):
    clerk_user_id: str
    sources: Optional[List[str]] = None
    match_threshold: float = 0.7

async def run_job_scan(user_profile: dict, sources: List[str], match_threshold: float):
    """Background task to run the LangGraph workflow"""
    from backend.agents.supervisor import supervisor_node
    from backend.agents.scout import scout_node
    from backend.agents.normalizer import normalizer_node
    from backend.agents.profiler import profiler_node
    from backend.agents.matcher import matcher_node
    from backend.agents.outreach import outreach_node
    from backend.agents.reviewer import reviewer_node
    
    # Initialize state
    state = {
        "user_profile": user_profile,
        "run_meta": {
            "sources_used": sources or ["google_jobs", "yc"],
            "match_threshold": match_threshold
        },
        "search_query": {},
        "raw_jobs": [],
        "normalized_jobs": [],
        "matched_jobs": [],
        "outreach_payloads": [],
        "errors": []
    }
    
    try:
        # Run workflow
        sup_result = await supervisor_node(state)
        state.update(sup_result)
        
        scout_result = await scout_node(state)
        state.update(scout_result)
        
        norm_result = await normalizer_node(state)
        state.update(norm_result)
        
        prof_result = await profiler_node(state)
        state.update(prof_result)
        
        match_result = await matcher_node(state)
        state.update(match_result)
        
        out_result = await outreach_node(state)
        state.update(out_result)
        
        rev_result = await reviewer_node(state)
        state.update(rev_result)
        
        print(f"Scan completed. Matched {len(state['matched_jobs'])} jobs.")
        
    except Exception as e:
        print(f"Error during job scan: {e}")
        state["errors"].append(str(e))

@router.post("/scan")
async def trigger_scan(
    request: ScanRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_database)
):
    """Trigger a job scan for a user"""
    user_repo = UserRepository(db)
    user = await user_repo.find_one({"clerk_user_id": request.clerk_user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_profile = user.get("profile", {})
    
    # Add background task
    background_tasks.add_task(
        run_job_scan,
        user_profile,
        request.sources,
        request.match_threshold
    )
    
    return {"message": "Job scan started", "status": "processing"}

@router.get("")
async def list_jobs(
    clerk_user_id: str,
    limit: int = 50,
    db = Depends(get_database)
):
    """List matched jobs for a user"""
    job_repo = JobRepository(db)
    
    # In a real implementation, we'd filter by user_id
    # For now, return all jobs
    jobs = await job_repo.find_all(limit=limit)
    
    return {"jobs": jobs, "total": len(jobs)}

@router.get("/{job_id}")
async def get_job(
    job_id: str,
    db = Depends(get_database)
):
    """Get job details"""
    job_repo = JobRepository(db)
    job = await job_repo.find_by_id(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@router.post("/{job_id}/outreach")
async def generate_outreach(
    job_id: str,
    clerk_user_id: str,
    db = Depends(get_database)
):
    """Generate outreach for a specific job"""
    from backend.agents.outreach import generate_outreach as gen_outreach
    
    user_repo = UserRepository(db)
    job_repo = JobRepository(db)
    
    user = await user_repo.find_one({"clerk_user_id": clerk_user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    job_data = await job_repo.find_by_id(job_id)
    if not job_data:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = Job(**job_data)
    user_profile = user.get("profile", {})
    
    # Load prompt
    import os
    prompt_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "agents", "prompts", "outreach.txt"
    )
    with open(prompt_path, "r") as f:
        system_prompt_template = f.read()
    
    result = await gen_outreach(job, user_profile, system_prompt_template)
    
    return result

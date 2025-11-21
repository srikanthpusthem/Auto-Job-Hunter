from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from backend.db.mongo import get_database
from backend.db.repositories import JobRepository, UserRepository, RunRepository
from backend.db.models import Job, ScanRun
from uuid import uuid4
import asyncio

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

class ScanRequest(BaseModel):
    clerk_user_id: str
    sources: Optional[List[str]] = None
    match_threshold: float = 0.7
    keywords: Optional[List[str]] = None
    location: Optional[str] = None

async def run_job_scan(user_profile: dict, sources: List[str], match_threshold: float, keywords: List[str] = None, location: str = None, scan_run_id: str = None, db=None):
    """Background task to run the LangGraph workflow"""
    from backend.agents.supervisor import supervisor_node
    from backend.agents.scout import scout_node
    from backend.agents.normalizer import normalizer_node
    from backend.agents.profiler import profiler_node
    from backend.agents.matcher import matcher_node
    from backend.agents.outreach import outreach_node
    from backend.agents.reviewer import reviewer_node
    
    # Build search query from keywords and profile
    search_keywords = keywords or []
    if user_profile.get("keywords"):
        search_keywords.extend(user_profile.get("keywords", []))
    if user_profile.get("skills") and not keywords:
        # Use skills as keywords if no keywords provided
        search_keywords.extend(user_profile.get("skills", []))
    
    # Remove duplicates
    search_keywords = list(set(search_keywords))
    
    # Initialize state
    state = {
        "user_profile": user_profile,
        "run_meta": {
            "sources_used": sources or ["google_jobs", "yc"],
            "match_threshold": match_threshold,
            "scan_run_id": scan_run_id
        },
        "search_query": {
            "keywords": search_keywords,
            "location": location or user_profile.get("preferences", {}).get("location", "Remote")
        },
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
        
        # Update scan run with results
        if db and scan_run_id:
            run_repo = RunRepository(db)
            await run_repo.update(scan_run_id, {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "jobs_found": len(state.get("raw_jobs", [])),
                "jobs_matched": len(state.get("matched_jobs", []))
            })
        
        print(f"Scan completed. Matched {len(state['matched_jobs'])} jobs.")
        
    except Exception as e:
        print(f"Error during job scan: {e}")
        state["errors"].append(str(e))
        
        # Update scan run with error
        if db and scan_run_id:
            run_repo = RunRepository(db)
            await run_repo.update(scan_run_id, {
                "status": "failed",
                "completed_at": datetime.utcnow(),
                "error": str(e)
            })

@router.post("/scan")
async def trigger_scan(
    request: ScanRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_database)
):
    """Trigger a job scan for a user"""
    user_repo = UserRepository(db)
    run_repo = RunRepository(db)
    
    user = await user_repo.find_one({"clerk_user_id": request.clerk_user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_profile = user.get("profile", {})
    
    # Create scan run record
    scan_run_id = str(uuid4())
    scan_run = {
        "_id": scan_run_id,
        "status": "running",
        "sources": request.sources or ["google_jobs", "yc"],
        "jobs_found": 0,
        "jobs_matched": 0,
        "started_at": datetime.utcnow(),
        "clerk_user_id": request.clerk_user_id
    }
    await run_repo.create(scan_run)
    
    # Add background task
    background_tasks.add_task(
        run_job_scan,
        user_profile,
        request.sources,
        request.match_threshold,
        request.keywords,
        request.location,
        scan_run_id,
        db
    )
    
    return {"message": "Job scan started", "status": "processing", "scan_run_id": scan_run_id}

@router.get("")
async def list_jobs(
    clerk_user_id: str,
    limit: int = 50,
    status: Optional[str] = None,
    scan_run_id: Optional[str] = None,
    date_from: Optional[str] = None,  # ISO date string
    date_to: Optional[str] = None,  # ISO date string
    source: Optional[str] = None,
    min_match_score: Optional[float] = None,
    sort_by: Optional[str] = "created_at",  # created_at, posted_at, match_score
    sort_order: Optional[str] = "desc",  # asc, desc
    db = Depends(get_database)
):
    """List matched jobs for a user with filtering and sorting"""
    job_repo = JobRepository(db)
    
    # Build query
    query = {}
    
    if status:
        query["status"] = status
    
    if scan_run_id:
        query["metadata.scan_run_id"] = scan_run_id
    
    if source:
        query["source"] = source
    
    if min_match_score is not None:
        query["match_score"] = {"$gte": min_match_score}
    
    # Date filtering
    if date_from or date_to:
        date_query = {}
        if date_from:
            try:
                date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                date_query["$gte"] = date_from_dt
            except:
                pass
        if date_to:
            try:
                date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                date_to_dt = date_to_dt.replace(hour=23, minute=59, second=59)
                date_query["$lte"] = date_to_dt
            except:
                pass
        if date_query:
            query["posted_at"] = date_query
    
    # Get jobs
    jobs = await job_repo.find_all(query, limit=limit)
    
    # Convert to dicts if needed
    if jobs and isinstance(jobs[0], dict):
        jobs = jobs
    else:
        jobs = [job.model_dump(by_alias=True) if hasattr(job, 'model_dump') else job for job in jobs]
    
    # Sort jobs
    if sort_by == "posted_at":
        jobs.sort(key=lambda x: x.get("posted_at") or datetime.min, reverse=(sort_order == "desc"))
    elif sort_by == "match_score":
        jobs.sort(key=lambda x: x.get("match_score") or 0, reverse=(sort_order == "desc"))
    elif sort_by == "created_at":
        jobs.sort(key=lambda x: x.get("created_at") or x.get("metadata", {}).get("collected_at") or datetime.min, reverse=(sort_order == "desc"))
    
    # Get scan runs for grouping
    run_repo = RunRepository(db)
    recent_runs = await run_repo.get_recent_runs(limit=20)
    
    return {
        "jobs": jobs,
        "total": len(jobs),
        "scan_runs": recent_runs
    }

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

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from backend.app.db.mongo import get_database
from backend.app.services.job_service import JobService
from backend.app.services.user_service import UserService
from backend.app.services.run_service import RunService

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

class ScanRequest(BaseModel):
    clerk_user_id: str
    sources: Optional[List[str]] = None
    match_threshold: float = 0.7
    keywords: Optional[List[str]] = None
    location: Optional[str] = None

@router.post("/scan")
async def trigger_scan(
    request: ScanRequest,
    background_tasks: BackgroundTasks,
    db = Depends(get_database)
):
    user_service = UserService(db)
    run_service = RunService(db)
    job_service = JobService(db)
    
    user = await user_service.get_user_by_clerk_id(request.clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_profile = user.get("profile", {})
    
    try:
        scan_run_id = await run_service.start_run(request.clerk_user_id, request.sources)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    background_tasks.add_task(
        job_service.run_job_scan,
        user_profile,
        request.clerk_user_id,
        request.sources,
        request.match_threshold,
        request.keywords,
        request.location,
        scan_run_id
    )
    
    return {"message": "Job scan started", "status": "processing", "scan_run_id": scan_run_id}

@router.get("")
async def list_jobs(
    clerk_user_id: str,
    limit: int = 50,
    status: Optional[str] = None,
    scan_run_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    source: Optional[str] = None,
    min_match_score: Optional[float] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    db = Depends(get_database)
):
    job_service = JobService(db)
    run_service = RunService(db)
    
    filters = {
        "status": status,
        "scan_run_id": scan_run_id,
        "date_from": date_from,
        "date_to": date_to,
        "source": source,
        "min_match_score": min_match_score
    }
    
    jobs = await job_service.list_jobs(filters, limit, sort_by, sort_order)
    recent_runs = await run_service.get_recent_runs(limit=20)
    
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
    job_service = JobService(db)
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/outreach")
async def generate_outreach(
    job_id: str,
    clerk_user_id: str,
    db = Depends(get_database)
):
    user_service = UserService(db)
    job_service = JobService(db)
    
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = await job_service.generate_outreach(job_id, user.get("profile", {}))
    if not result:
        raise HTTPException(status_code=404, detail="Job not found or generation failed")
        
    return result

class UpdateStatusRequest(BaseModel):
    status: str

@router.patch("/{job_id}/status")
async def update_status(
    job_id: str,
    request: UpdateStatusRequest,
    db = Depends(get_database)
):
    job_service = JobService(db)
    success = await job_service.update_status(job_id, request.status)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update status")
    return {"message": "Status updated", "job_id": job_id, "new_status": request.status}

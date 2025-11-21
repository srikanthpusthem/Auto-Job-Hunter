from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
from backend.db.mongo import get_database
from backend.db.repositories import JobRepository, RunRepository
from backend.db.models import JobStatus

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def format_relative_time(timestamp: datetime) -> str:
    """Format datetime as relative time (e.g., '2h ago')"""
    if not timestamp:
        return "Unknown"
    
    now = datetime.utcnow()
    if isinstance(timestamp, str):
        try:
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except:
            return "Unknown"
    
    diff = now - timestamp.replace(tzinfo=None) if timestamp.tzinfo else now - timestamp
    
    if diff.days > 0:
        return f"{diff.days}d ago"
    elif diff.seconds >= 3600:
        hours = diff.seconds // 3600
        return f"{hours}h ago"
    elif diff.seconds >= 60:
        minutes = diff.seconds // 60
        return f"{minutes}m ago"
    else:
        return "Just now"

@router.get("/stats")
async def get_dashboard_stats(
    clerk_user_id: str,
    db = Depends(get_database)
):
    """Get dashboard statistics for a user"""
    job_repo = JobRepository(db)
    run_repo = RunRepository(db)
    
    try:
        # Get basic counts
        matched_count = await job_repo.count_by_status(JobStatus.MATCHED.value)
        applied_count = await job_repo.count_by_status(JobStatus.APPLIED.value)
        new_count = await job_repo.count_by_status(JobStatus.NEW.value)
        pending_reviews = matched_count + new_count
        
        # Get total jobs scanned from scan runs
        total_scanned = await run_repo.get_total_scanned()
        
        # Get match score statistics
        score_stats = await job_repo.get_match_score_stats()
        
        # Get status breakdown
        status_breakdown = await job_repo.get_status_breakdown()
        
        # Get top sources
        top_sources = await job_repo.count_by_source()
        
        # Get recent activity
        recent_runs = await run_repo.get_recent_runs(limit=5)
        recent_jobs = await job_repo.get_recent_jobs(limit=5)
        
        # Build activity feed
        activity = []
        
        # Add scan run activities
        for run in recent_runs:
            if run.get("status") == "completed":
                activity.append({
                    "type": "scan_completed",
                    "message": "Job scan completed",
                    "details": f"Found {run.get('jobs_found', 0)} jobs, matched {run.get('jobs_matched', 0)}",
                    "timestamp": run.get("completed_at") or run.get("started_at"),
                    "relative_time": format_relative_time(run.get("completed_at") or run.get("started_at"))
                })
        
        # Add recent job matches
        for job in recent_jobs[:3]:  # Limit to 3 most recent
            if job.get("match_score") and job.get("match_score") >= 0.7:
                activity.append({
                    "type": "job_matched",
                    "message": "New job match found",
                    "details": f"{job.get('title', 'Unknown')} at {job.get('company', 'Unknown')} ({int(job.get('match_score', 0) * 100)}% match)",
                    "timestamp": job.get("created_at"),
                    "relative_time": format_relative_time(job.get("created_at"))
                })
        
        # Sort activity by timestamp (most recent first)
        activity.sort(key=lambda x: x.get("timestamp") or datetime.min, reverse=True)
        activity = activity[:10]  # Limit to 10 most recent
        
        return {
            "stats": {
                "total_jobs_scanned": total_scanned,
                "matched_jobs": matched_count,
                "applications_sent": applied_count,
                "pending_reviews": pending_reviews,
                "average_match_score": round(score_stats.get("average", 0.0), 2),
                "high_match_jobs": score_stats.get("high_match_count", 0)
            },
            "recent_activity": activity,
            "top_sources": top_sources,
            "status_breakdown": status_breakdown
        }
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard statistics: {str(e)}")


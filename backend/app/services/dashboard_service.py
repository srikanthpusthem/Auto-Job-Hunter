from typing import Dict, Any, List
from datetime import datetime
from backend.app.db.repositories.job_repository import JobRepository
from backend.app.db.repositories.scan_history_repository import ScanHistoryRepository
from backend.app.db.models import JobStatus

class DashboardService:
    def __init__(self, db):
        self.job_repo = JobRepository(db)
        self.run_repo = ScanHistoryRepository(db)

    def format_relative_time(self, timestamp: datetime) -> str:
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

    async def get_stats(self, clerk_user_id: str) -> Dict[str, Any]:
        # Get basic counts
        matched_count = await self.job_repo.count_by_status(JobStatus.MATCHED.value)
        applied_count = await self.job_repo.count_by_status(JobStatus.APPLIED.value)
        new_count = await self.job_repo.count_by_status(JobStatus.NEW.value)
        pending_reviews = matched_count + new_count
        
        # Get total jobs scanned from scan runs
        total_scanned = await self.run_repo.get_total_scanned()
        
        # Get match score statistics
        score_stats = await self.job_repo.get_match_score_stats()
        
        # Get status breakdown
        status_breakdown = await self.job_repo.get_status_breakdown()
        
        # Get top sources
        top_sources = await self.job_repo.count_by_source()
        
        # Get recent activity
        recent_runs = await self.run_repo.get_recent_runs(limit=5)
        recent_jobs = await self.job_repo.get_recent_jobs(limit=5)
        
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
                    "relative_time": self.format_relative_time(run.get("completed_at") or run.get("started_at"))
                })
        
        # Add recent job matches
        for job in recent_jobs[:3]:  # Limit to 3 most recent
            if job.get("match_score") and job.get("match_score") >= 0.7:
                activity.append({
                    "type": "job_matched",
                    "message": "New job match found",
                    "details": f"{job.get('title', 'Unknown')} at {job.get('company', 'Unknown')} ({int(job.get('match_score', 0) * 100)}% match)",
                    "timestamp": job.get("created_at"),
                    "relative_time": self.format_relative_time(job.get("created_at"))
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

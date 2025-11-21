from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from backend.app.db.repositories.run_repository import RunRepository, RunLogRepository

class RunService:
    def __init__(self, db):
        self.run_repo = RunRepository(db)
        self.log_repo = RunLogRepository(db)

    async def get_status(self) -> Dict[str, Any]:
        last_run = await self.run_repo.get_last_run()
        
        status = "idle"
        if last_run and last_run.get("status") == "running":
            started_at = last_run.get("started_at")
            if started_at and (datetime.utcnow() - started_at).total_seconds() > 3600:
                # Auto-fail stale run
                await self.run_repo.update(last_run["_id"], {"status": "failed", "error": "Run timed out (stale)"})
                status = "idle"
            else:
                status = "running"
        
        return {"status": status}

    async def start_run(self, clerk_user_id: str, sources: List[str] = None) -> str:
        # Check if already running
        last_run = await self.run_repo.get_last_run()
        if last_run and last_run.get("status") == "running":
            started_at = last_run.get("started_at")
            if started_at and (datetime.utcnow() - started_at).total_seconds() < 3600:
                raise ValueError("Agent is already running")
            
            # Mark stale run as failed
            await self.run_repo.update(last_run["_id"], {"status": "failed", "error": "Run timed out (stale)"})
        
        # Create new run
        run_data = {
            "status": "running",
            "started_at": datetime.utcnow(),
            "jobs_found": 0,
            "jobs_matched": 0,
            "clerk_user_id": clerk_user_id,
            "sources": sources or []
        }
        run_id = await self.run_repo.create(run_data)
        
        # Add initial log
        await self.log_repo.add_log("Agent started manually", run_id=run_id)
        await self.log_repo.add_log("Initializing search parameters...", run_id=run_id)
        
        return run_id

    async def stop_run(self):
        last_run = await self.run_repo.get_last_run()
        if not last_run or last_run.get("status") != "running":
            raise ValueError("No active run to stop")
        
        # Update run status
        await self.run_repo.update(last_run["_id"], {
            "status": "stopped",
            "completed_at": datetime.utcnow(),
            "error": "Stopped by user"
        })
        
        await self.log_repo.add_log("Agent stopped by user", run_id=last_run["_id"])

    async def get_timeline(self, limit: int = 50) -> List[Dict[str, Any]]:
        logs = await self.log_repo.get_recent_logs(limit=limit)
        
        timeline = []
        for log in logs:
            timeline.append({
                "step": log.get("step"),
                "timestamp": log.get("timestamp"),
                "metadata": log.get("metadata")
            })
        return timeline

    async def get_last_completed_run(self):
        return await self.run_repo.get_last_completed_run()

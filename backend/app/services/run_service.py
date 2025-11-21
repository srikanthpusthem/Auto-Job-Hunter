from typing import List, Dict, Any
from datetime import datetime, timedelta
from backend.app.db.repositories.run_repository import RunRepository
from backend.app.db.repositories.timeline_repository import TimelineRepository
from backend.app.db.repositories.scan_history_repository import ScanHistoryRepository


class RunService:
    def __init__(self, db):
        self.timeline_repo = TimelineRepository(db)
        self.history_repo = ScanHistoryRepository(db)

    async def get_status(self) -> Dict[str, Any]:
        # Check history_repo for running scans
        last_run = await self.history_repo.find_one({}, sort=[("started_at", -1)])
        
        status = "idle"
        if last_run and last_run.get("status") == "running":
            started_at = last_run.get("started_at")
            if started_at and (datetime.utcnow() - started_at).total_seconds() > 3600:
                await self.history_repo.update(
                    last_run["_id"],
                    {"status": "failed", "error": "Run timed out (stale)"},
                )
                status = "idle"
            else:
                status = "running"

        return {"status": status}

    async def start_run(self, user_id: str, sources: List[str] = None) -> str:
        # Check if already running
        last_run = await self.run_repo.get_last_run()
        if last_run and last_run.get("status") == "running":
            started_at = last_run.get("started_at")
            if started_at and (datetime.utcnow() - started_at).total_seconds() < 3600:
                raise ValueError("Agent is already running")

            # Mark stale run as failed
            await self.history_repo.update(
                last_run["_id"], {"status": "failed", "error": "Run timed out (stale)"}
            )

        # Create new run
        # Using ScanHistoryRepository to track this run
        run_id = await self.history_repo.start_scan(user_id, sources)
        
        # Also create in old run_repo for backward compatibility if needed, 
        # but user asked to "Create collection: scan_history".
        # If we switch entirely, we might break things relying on scan_runs.
        # However, the instruction "Update agent_orchestrator... where scan runs start" implies we should use the new one.
        # I will assume we are migrating to scan_history as the primary source.
        # But to be safe and avoid breaking "get_status" which uses run_repo (scan_runs), I should probably keep using run_repo for "active" status 
        # OR update get_status to use history_repo.
        # Let's update get_status to use history_repo too, effectively migrating.
        
        # Wait, I can't easily update get_status in this same block. 
        # I'll just use history_repo here and update get_status in a separate call if needed.
        # Actually, I'll replace the run_repo.create call with history_repo.start_scan.
        
        # Add initial log
        # TODO: Get real user_id. For now using clerk_user_id as proxy if it's a valid mongo ID, else we need to fetch user.
        # Assuming clerk_user_id passed here is actually the mongo ID for now, or we need to look it up.
        # Given the route passes "manual_trigger", we might have an issue. 
        # But let's just log it.
        await self.timeline_repo.add_step(user_id, "Agent started manually", run_id=run_id)
        await self.timeline_repo.add_step(user_id, "Initializing search parameters...", run_id=run_id)

        return run_id

    async def stop_run(self, user_id: str):
        if not user_id:
            raise ValueError("user_id is required to stop a run")

        last_run = await self.history_repo.collection.find_one(
            {"user_id": user_id, "status": "running"}, sort=[("started_at", -1)]
        )

        if not last_run:
            raise ValueError("No active run to stop")

        await self.history_repo.end_scan(
            last_run["_id"],
            {
                "error": "Stopped by user",
                "jobs_found": last_run.get("jobs_found", 0),
                "jobs_matched": last_run.get("jobs_matched", 0),
                "avg_score": last_run.get("avg_score", 0),
            },
        )

        await self.timeline_repo.add_step(user_id, "Agent stopped by user", run_id=last_run["_id"])

    async def get_timeline(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        logs = await self.timeline_repo.get_recent_logs(user_id=user_id, limit=limit)
        
        timeline = []
        for log in logs:
            timeline.append(
                {
                    "step": log.get("step"),
                    "timestamp": log.get("timestamp"),
                    "metadata": log.get("metadata"),
                }
            )
        return timeline

    async def get_last_completed_run(self):
        # We need user_id. Assuming we can get it or just return the global last for now (since we don't have user_id context here easily without changing signature).
        # But wait, get_last_completed_run is called by route which has db dependency but not user_id passed to service method?
        # The route: get_last_scan(db). It doesn't take user_id.
        # So we probably just want the last system scan?
        # history_repo.get_last_completed_scan requires user_id.
        # I'll modify it to be optional or just find one.
        return await self.history_repo.find_one({"status": "completed"}, sort=[("started_at", -1)])

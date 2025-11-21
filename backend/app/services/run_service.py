from typing import List, Dict, Any
from datetime import datetime
from backend.app.db.repositories.timeline_repository import TimelineRepository
from backend.app.db.repositories.scan_history_repository import ScanHistoryRepository


class RunService:
    def __init__(self, db):
        self.timeline_repo = TimelineRepository(db)
        self.history_repo = ScanHistoryRepository(db)

    async def get_status(self) -> Dict[str, Any]:
        last_run = await self.history_repo.get_last_run()

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

    async def start_run(self, clerk_user_id: str, sources: List[str] = None) -> str:
        last_run = await self.history_repo.get_last_run()
        if last_run and last_run.get("status") == "running":
            started_at = last_run.get("started_at")
            if started_at and (datetime.utcnow() - started_at).total_seconds() < 3600:
                raise ValueError("Agent is already running")

            await self.history_repo.update(
                last_run["_id"],
                {"status": "failed", "error": "Run timed out (stale)"},
            )

        run_id = await self.history_repo.start_scan(clerk_user_id, sources)

        await self.timeline_repo.add_step(clerk_user_id, "Agent started manually", run_id=run_id)
        await self.timeline_repo.add_step(
            clerk_user_id, "Initializing search parameters...", run_id=run_id
        )

        return run_id

    async def stop_run(self):
        last_run = await self.history_repo.get_last_run(status="running")

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
            status="failed",
        )

        user_id = last_run.get("user_id", "system")
        await self.timeline_repo.add_step(
            user_id, "Agent stopped by user", run_id=last_run["_id"]
        )

    async def get_timeline(self, limit: int = 50) -> List[Dict[str, Any]]:
        logs = await self.timeline_repo.get_recent_logs(limit=limit)

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
        return await self.history_repo.get_last_run(status="completed")

    async def get_recent_runs(self, limit: int = 20):
        return await self.history_repo.get_recent_runs(limit=limit)

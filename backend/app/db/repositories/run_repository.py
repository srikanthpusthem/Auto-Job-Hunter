from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from backend.app.db.models import ScanRun
from backend.app.db.repositories.base_repository import BaseRepository

class RunRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "scan_runs")
    
    async def get_recent_runs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most recent scan runs"""
        cursor = self.collection.find({}).sort("started_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def get_total_scanned(self) -> int:
        """Get total number of jobs scanned across all completed runs"""
        pipeline = [
            {
                "$match": {"status": "completed"}
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$jobs_found"}
                }
            }
        ]
        result = await self.collection.aggregate(pipeline).to_list(length=1)
        if result:
            return result[0].get("total", 0)
        return 0
    
    async def get_last_completed_run(self) -> Optional[Dict[str, Any]]:
        """Get the last successfully completed run"""
        return await self.find_one({"status": "completed"})
    
    async def get_last_run(self) -> Optional[Dict[str, Any]]:
        """Get the last run regardless of status"""
        cursor = self.collection.find({}).sort("started_at", -1).limit(1)
        results = await cursor.to_list(length=1)
        return results[0] if results else None

class RunLogRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "run_logs")
    
    async def get_recent_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get most recent logs for timeline"""
        cursor = self.collection.find({}).sort("timestamp", -1).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def add_log(self, step: str, run_id: Optional[str] = None, metadata: Dict[str, Any] = None):
        """Add a log entry"""
        log = {
            "step": step,
            "run_id": run_id,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {}
        }
        await self.create(log)

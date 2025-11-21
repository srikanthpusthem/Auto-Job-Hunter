from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from backend.app.db.repositories.base_repository import BaseRepository
from backend.app.db.models import ScanRun

class ScanHistoryRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "scan_history")

    async def start_scan(self, user_id: str, sources: List[str] = None) -> str:
        """Start a new scan and return its ID"""
        scan_data = {
            "status": "running",
            "started_at": datetime.utcnow(),
            "jobs_found": 0,
            "jobs_matched": 0,
            "avg_score": 0.0,
            "user_id": user_id,
            "sources": sources or []
        }
        return await self.create(scan_data)

    async def end_scan(self, scan_id: str, stats: Dict[str, Any]):
        """Update scan with final stats"""
        update_data = {
            "status": "completed",
            "completed_at": datetime.utcnow(),
            **stats
        }
        await self.update(scan_id, update_data)

    async def list_scans(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """List recent scans for a user"""
        cursor = self.collection.find({"user_id": user_id}).sort("started_at", -1).limit(limit)
        return await cursor.to_list(length=limit)

    async def get_total_scanned(self, user_id: str) -> int:
        """Get total number of jobs scanned for a user"""
        pipeline = [
            {"$match": {"user_id": user_id, "status": "completed"}},
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

    async def get_last_completed_scan(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the last successfully completed scan for a user"""
        return await self.find_one({"user_id": user_id, "status": "completed"}, sort=[("started_at", -1)])

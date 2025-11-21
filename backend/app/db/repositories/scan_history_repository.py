from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from backend.app.db.repositories.base_repository import BaseRepository

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

    async def end_scan(self, scan_id: str, stats: Dict[str, Any], status: str = "completed"):
        """Update scan with final stats and status"""
        update_data = {
            "status": status,
            "completed_at": datetime.utcnow(),
            **stats
        }
        await self.update(scan_id, update_data)

    async def list_scans(self, user_id: str, limit: int = 20, sort_by: str = "started_at", sort_order: int = -1) -> List[Dict[str, Any]]:
        """List recent scans for a user"""
        return await self.find_all(
            {"user_id": user_id},
            limit=limit,
            sort=[("started_at", -1)],
        )

    async def get_last_completed_scan(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get the last successfully completed scan for a user"""
        return await self.find_one({"user_id": user_id, "status": "completed"}, sort=[("started_at", -1)])

    async def get_last_run(
        self,
        status: Optional[str] = None,
        user_id: Optional[str] = None,
        sort_by: str = "started_at",
        sort_order: int = -1,
    ) -> Optional[Dict[str, Any]]:
        """Get the most recent run optionally filtered by status or user"""
        query: Dict[str, Any] = {}
        if status:
            query["status"] = status
        if user_id:
            query["user_id"] = user_id

        return await self.find_one(query, sort=[(sort_by, sort_order)])

    async def get_recent_runs(
        self,
        limit: int = 10,
        user_id: Optional[str] = None,
        sort_by: str = "started_at",
        sort_order: int = -1,
    ) -> List[Dict[str, Any]]:
        """Get recent runs with optional user filter and sorting"""
        query: Dict[str, Any] = {}
        if user_id:
            query["user_id"] = user_id

        cursor = (
            self.collection
            .find(query)
            .sort(sort_by, sort_order)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    async def get_total_scanned(self, user_id: Optional[str] = None) -> int:
        """Get total number of jobs scanned across completed runs"""
        match_filter: Dict[str, Any] = {"status": "completed"}
        if user_id:
            match_filter["user_id"] = user_id

        pipeline = [
            {"$match": match_filter},
            {"$group": {"_id": None, "total": {"$sum": "$jobs_found"}}},
        ]

        result = await self.collection.aggregate(pipeline).to_list(length=1)
        if result:
            return result[0].get("total", 0)
        return 0

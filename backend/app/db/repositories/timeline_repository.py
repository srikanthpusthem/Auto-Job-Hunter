from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from backend.app.db.repositories.base_repository import BaseRepository

class TimelineRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "run_logs")
    
    async def get_recent_logs(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get most recent logs for timeline scoped to a user"""
        if not user_id:
            raise ValueError("user_id is required to fetch timeline logs")

        cursor = (
            self.collection
            .find({"user_id": user_id})
            .sort("timestamp", -1)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)
    
    async def add_step(self, user_id: str, step: str, run_id: Optional[str] = None, metadata: Dict[str, Any] = None):
        """Add a log entry"""
        log = {
            "user_id": user_id,
            "step": step,
            "run_id": run_id,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {}
        }
        await self.create(log)

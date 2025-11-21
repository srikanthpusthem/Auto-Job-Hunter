from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.db.models import Job
from backend.app.db.repositories.base_repository import BaseRepository

class JobRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "matched_jobs")

    async def find_by_id(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Find job by ID"""
        return await self.find_one({"_id": job_id})
    
    async def find_by_fingerprint(self, fingerprint: str) -> Optional[Dict[str, Any]]:
        """Find job by fingerprint to check for duplicates"""
        return await self.find_one({"metadata.fingerprint": fingerprint})
    
    async def get_matched_jobs(self, limit: int = 50) -> List[Job]:
        data = await self.find_all({}, limit=limit)  # Return all jobs, not just matched
        return [Job(**item) for item in data]
    
    async def count_by_status(self, status: str) -> int:
        """Count jobs by status"""
        count = await self.collection.count_documents({"status": status})
        return count
    
    async def get_recent_jobs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most recently matched jobs"""
        cursor = self.collection.find({}).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def get_match_score_stats(self) -> Dict[str, Any]:
        """Get average match score and distribution"""
        pipeline = [
            {
                "$match": {
                    "match_score": {"$exists": True, "$ne": None}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "average": {"$avg": "$match_score"},
                    "count": {"$sum": 1},
                    "high_match_count": {
                        "$sum": {"$cond": [{"$gte": ["$match_score", 0.8]}, 1, 0]}
                    }
                }
            }
        ]
        result = await self.collection.aggregate(pipeline).to_list(length=1)
        if result:
            return {
                "average": result[0].get("average", 0.0),
                "count": result[0].get("count", 0),
                "high_match_count": result[0].get("high_match_count", 0)
            }
        return {"average": 0.0, "count": 0, "high_match_count": 0}
    
    async def count_by_source(self) -> List[Dict[str, Any]]:
        """Count jobs grouped by source"""
        pipeline = [
            {
                "$group": {
                    "_id": "$source",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            }
        ]
        results = await self.collection.aggregate(pipeline).to_list(length=10)
        return [{"source": r["_id"], "count": r["count"]} for r in results]
    
    async def get_status_breakdown(self) -> Dict[str, int]:
        """Get count of jobs by each status"""
        pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        results = await self.collection.aggregate(pipeline).to_list(length=10)
        breakdown = {}
        for r in results:
            breakdown[r["_id"]] = r["count"]
        return breakdown

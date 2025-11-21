from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.db.models import Job
from backend.app.db.repositories.base_repository import BaseRepository

class JobRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "matched_jobs")

    async def find_by_id(self, job_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Find job by ID"""
        query = {"_id": job_id}
        if user_id:
            query["user_id"] = user_id
        return await self.find_one(query)

    async def find_by_fingerprint(self, fingerprint: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Find job by fingerprint to check for duplicates"""
        query = {"metadata.fingerprint": fingerprint}
        if user_id:
            query["user_id"] = user_id
        return await self.find_one(query)
    
    async def get_matched_jobs(self, limit: int = 50, user_id: Optional[str] = None) -> List[Job]:
        query: Dict[str, Any] = {}
        if user_id:
            query["user_id"] = user_id
        data = await self.find_all(query, limit=limit)  # Return all jobs, not just matched
        return [Job(**item) for item in data]

    async def count_by_status(self, status: str, user_id: Optional[str] = None) -> int:
        """Count jobs by status"""
        query = {"status": status}
        if user_id:
            query["user_id"] = user_id
        count = await self.collection.count_documents(query)
        return count

    async def get_recent_jobs(self, limit: int = 10, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get most recently matched jobs"""
        query: Dict[str, Any] = {}
        if user_id:
            query["user_id"] = user_id
        cursor = self.collection.find(query).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def get_match_score_stats(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Get average match score and distribution"""
        match_stage: Dict[str, Any] = {
            "match_score": {"$exists": True, "$ne": None}
        }
        if user_id:
            match_stage["user_id"] = user_id

        pipeline = [
            {
                "$match": match_stage
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
    
    async def count_by_source(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Count jobs grouped by source"""
        pipeline = []
        if user_id:
            pipeline.append({"$match": {"user_id": user_id}})
        pipeline.extend([
            {
                "$group": {
                    "_id": "$source",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            }
        ])
        results = await self.collection.aggregate(pipeline).to_list(length=10)
        return [{"source": r["_id"], "count": r["count"]} for r in results]

    async def get_status_breakdown(self, user_id: Optional[str] = None) -> Dict[str, int]:
        """Get count of jobs by each status"""
        pipeline = []
        if user_id:
            pipeline.append({"$match": {"user_id": user_id}})
        pipeline.append(
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        )
        results = await self.collection.aggregate(pipeline).to_list(length=10)
        breakdown = {}
        for r in results:
            breakdown[r["_id"]] = r["count"]
        return breakdown

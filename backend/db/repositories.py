from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.db.models import User, Job, ScanRun
from uuid import uuid4
from datetime import datetime

class BaseRepository:
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str):
        self.collection = db[collection_name]

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(query)

    async def find_all(self, query: Dict[str, Any] = {}, limit: int = 100) -> List[Dict[str, Any]]:
        cursor = self.collection.find(query).limit(limit)
        return await cursor.to_list(length=limit)

    async def create(self, data: Dict[str, Any]) -> str:
        if "_id" not in data:
            data["_id"] = str(uuid4())
        await self.collection.insert_one(data)
        return data["_id"]

    async def update(self, id: str, data: Dict[str, Any]):
        await self.collection.update_one({"_id": id}, {"$set": data})

    async def delete(self, id: str):
        await self.collection.delete_one({"_id": id})

class UserRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "users")

    async def get_by_email(self, email: str) -> Optional[User]:
        data = await self.find_one({"email": email})
        return User(**data) if data else None

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

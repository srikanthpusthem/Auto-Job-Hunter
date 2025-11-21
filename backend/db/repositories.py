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

class RunRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "scan_runs")

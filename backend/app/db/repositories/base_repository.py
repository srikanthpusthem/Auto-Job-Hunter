from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from uuid import uuid4

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

from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.db.models import OutreachTemplate
from backend.app.db.repositories.base_repository import BaseRepository

class OutreachRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "outreach_templates")

    async def get_by_user_id(self, user_id: str) -> List[OutreachTemplate]:
        """Get all templates for a user"""
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        results = await cursor.to_list(length=100)
        return [OutreachTemplate(**r) for r in results]

    async def get_by_id(self, template_id: str, user_id: str) -> Optional[OutreachTemplate]:
        """Get a specific template by ID and user ID"""
        data = await self.find_one({"_id": template_id, "user_id": user_id})
        return OutreachTemplate(**data) if data else None

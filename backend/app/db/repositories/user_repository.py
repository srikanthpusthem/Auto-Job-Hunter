from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.db.models import User
from backend.app.db.repositories.base_repository import BaseRepository

class UserRepository(BaseRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        super().__init__(db, "users")

    async def get_by_email(self, email: str) -> Optional[User]:
        data = await self.find_one({"email": email})
        return User(**data) if data else None

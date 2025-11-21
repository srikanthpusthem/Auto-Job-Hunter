from typing import Optional, Dict, Any
from backend.app.db.repositories.user_repository import UserRepository
from backend.app.db.models import User

class UserService:
    def __init__(self, db):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_user_by_clerk_id(self, clerk_user_id: str) -> Optional[Dict[str, Any]]:
        return await self.user_repo.find_one({"clerk_user_id": clerk_user_id})

    async def update_profile(self, user_id: str, profile_data: Dict[str, Any]):
        return await self.user_repo.update(user_id, {"profile": profile_data})
    
    async def create_user(self, user_data: Dict[str, Any]):
        user_id = await self.user_repo.create(user_data)
        
        # Seed default templates
        from backend.app.services.outreach_service import OutreachService
        outreach_service = OutreachService(self.db)
        await outreach_service.create_default_templates(user_id)
        
        return user_id

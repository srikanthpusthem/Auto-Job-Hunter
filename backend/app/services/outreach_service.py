from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4
from backend.app.db.repositories.outreach_repository import OutreachRepository
from backend.app.db.models import OutreachTemplate, OutreachType

class OutreachService:
    def __init__(self, db):
        self.outreach_repo = OutreachRepository(db)

    async def list_templates(self, user_id: str) -> List[OutreachTemplate]:
        return await self.outreach_repo.get_by_user_id(user_id)

    async def get_template(self, template_id: str, user_id: str) -> Optional[OutreachTemplate]:
        return await self.outreach_repo.get_by_id(template_id, user_id)

    async def create_template(self, user_id: str, data: Dict[str, Any]) -> str:
        template_data = {
            "_id": str(uuid4()),
            "user_id": user_id,
            "name": data.get("name"),
            "subject": data.get("subject"),
            "content": data.get("content"),
            "type": data.get("type", "email"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        return await self.outreach_repo.create(template_data)

    async def update_template(self, user_id: str, template_id: str, data: Dict[str, Any]) -> bool:
        # Verify ownership
        existing = await self.outreach_repo.get_by_id(template_id, user_id)
        if not existing:
            return False
        
        update_data = {
            "updated_at": datetime.utcnow()
        }
        if "name" in data: update_data["name"] = data["name"]
        if "subject" in data: update_data["subject"] = data["subject"]
        if "content" in data: update_data["content"] = data["content"]
        if "type" in data: update_data["type"] = data["type"]
        
        await self.outreach_repo.update(template_id, update_data)
        return True

    async def duplicate_template(self, user_id: str, template_id: str) -> Optional[str]:
        original = await self.outreach_repo.get_by_id(template_id, user_id)
        if not original:
            return None
        
        new_data = {
            "name": f"{original.name} (Copy)",
            "subject": original.subject,
            "content": original.content,
            "type": original.type
        }
        return await self.create_template(user_id, new_data)

    async def delete_template(self, user_id: str, template_id: str) -> bool:
        existing = await self.outreach_repo.get_by_id(template_id, user_id)
        if not existing:
            return False
        
        await self.outreach_repo.delete(template_id)
        return True

    async def create_default_templates(self, user_id: str):
        defaults = [
            {
                "name": "Cold Email - General",
                "subject": "Application for {job_title} role",
                "content": "Hi {hiring_manager},\n\nI came across the {job_title} position at {company} and was impressed by your work in {industry}. With my background in {skills}, I believe I could be a great fit.\n\nBest,\n{my_name}",
                "type": "email"
            },
            {
                "name": "LinkedIn Connection",
                "subject": None,
                "content": "Hi {hiring_manager}, I'm interested in the {job_title} role at {company}. Would love to connect!",
                "type": "linkedin"
            },
            {
                "name": "Follow-up Email",
                "subject": "Following up on my application",
                "content": "Hi {hiring_manager},\n\nJust wanted to follow up on my application for the {job_title} role. I'm still very interested!\n\nBest,\n{my_name}",
                "type": "follow_up"
            }
        ]
        
        for t in defaults:
            await self.create_template(user_id, t)

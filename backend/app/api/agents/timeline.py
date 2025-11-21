from fastapi import APIRouter, Depends, HTTPException
from backend.app.db.mongo import get_database
from backend.app.db.repositories.timeline_repository import TimelineRepository
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/api/agents/timeline", tags=["agents"])

@router.get("")
async def get_timeline(
    clerk_user_id: str,
    limit: int = 50,
    db = Depends(get_database)
):
    user_service = UserService(db)
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    repo = TimelineRepository(db)
    logs = await repo.get_recent_logs(user_id=user["_id"], limit=limit)
    
    return logs

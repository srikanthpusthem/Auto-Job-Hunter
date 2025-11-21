from fastapi import APIRouter, Depends, HTTPException
from backend.app.db.mongo import get_database
from backend.app.db.repositories.scan_history_repository import ScanHistoryRepository
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/api/agents/history", tags=["agents"])

@router.get("")
async def get_history(
    clerk_user_id: str,
    limit: int = 20,
    db = Depends(get_database)
):
    user_service = UserService(db)
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    repo = ScanHistoryRepository(db)
    scans = await repo.list_scans(user_id=user["_id"], limit=limit)
    
    return scans

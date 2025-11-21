from fastapi import APIRouter, Depends, HTTPException
from backend.app.db.mongo import get_database
from backend.app.services.dashboard_service import DashboardService
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    clerk_user_id: str,
    db = Depends(get_database)
):
    dashboard_service = DashboardService(db)
    user_service = UserService(db)
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        return await dashboard_service.get_stats(str(user.get("_id")))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard statistics: {str(e)}")

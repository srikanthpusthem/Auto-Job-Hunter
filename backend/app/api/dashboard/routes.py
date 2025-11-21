from fastapi import APIRouter, Depends, HTTPException
from backend.app.db.mongo import get_database
from backend.app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    clerk_user_id: str,
    db = Depends(get_database)
):
    dashboard_service = DashboardService(db)
    try:
        return await dashboard_service.get_stats(clerk_user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard statistics: {str(e)}")

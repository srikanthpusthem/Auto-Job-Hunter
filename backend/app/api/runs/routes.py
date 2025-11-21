from fastapi import APIRouter, Depends, HTTPException, Body
from backend.app.db.mongo import get_database
from backend.app.services.run_service import RunService
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/api/runs", tags=["runs"])

@router.get("/status")
async def get_agent_status(db = Depends(get_database)):
    run_service = RunService(db)
    return await run_service.get_status()

@router.get("/next-scan")
async def get_next_scan():
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    next_scan = (now + timedelta(days=1)).replace(hour=6, minute=0, second=0, microsecond=0)
    return {"next_scan": next_scan}

@router.get("/last-scan")
async def get_last_scan(db = Depends(get_database)):
    run_service = RunService(db)
    last_run = await run_service.get_last_completed_run()
    if not last_run:
        return {"last_scan": None, "jobs_scanned": 0}
    return {
        "last_scan": last_run.get("completed_at") or last_run.get("started_at"),
        "jobs_scanned": last_run.get("jobs_found", 0)
    }

@router.patch("/auto-scan")
async def toggle_auto_scan(
    enabled: bool = Body(..., embed=True),
    clerk_user_id: str = Body(..., embed=True),
    db = Depends(get_database)
):
    user_service = UserService(db)
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = user.get("profile", {})
    preferences = profile.get("preferences", {})
    preferences["auto_scan_enabled"] = enabled
    profile["preferences"] = preferences
    
    await user_service.update_profile(user["_id"], profile)
    return {"auto_scan_enabled": enabled}

@router.post("/start")
async def start_run(
    clerk_user_id: str = Body(..., embed=True),
    db = Depends(get_database)
):
    user_service = UserService(db)
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    run_service = RunService(db)
    try:
        run_id = await run_service.start_run(user["_id"])
        return {"run_id": run_id, "status": "running"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stop")
async def stop_run(
    clerk_user_id: str = Body(..., embed=True),
    db = Depends(get_database)
):
    user_service = UserService(db)
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    run_service = RunService(db)
    try:
        await run_service.stop_run(user["_id"])
        return {"status": "stopped"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/timeline")
async def get_timeline(
    clerk_user_id: str,
    limit: int = 50,
    db = Depends(get_database)
):
    user_service = UserService(db)
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    run_service = RunService(db)
    return await run_service.get_timeline(user_id=user["_id"], limit=limit)

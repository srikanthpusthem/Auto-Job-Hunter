from fastapi import APIRouter, Depends, HTTPException, Body
from backend.app.db.mongo import get_database
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/profile")
async def create_or_update_profile(
    profile_data: dict = Body(...),
    db = Depends(get_database)
):
    user_service = UserService(db)
    clerk_user_id = profile_data.get("clerk_user_id")
    email = profile_data.get("email")
    
    if not clerk_user_id or not email:
        raise HTTPException(status_code=400, detail="Missing clerk_user_id or email")
        
    existing_user = await user_service.get_user_by_clerk_id(clerk_user_id)
    
    if existing_user:
        # Update
        await user_service.update_profile(existing_user["_id"], profile_data.get("profile", {}))
        return {"message": "Profile updated", "user_id": existing_user["_id"]}
    else:
        # Create
        user_id = await user_service.create_user(profile_data)
        return {"message": "Profile created", "user_id": user_id}

@router.get("/profile/{clerk_user_id}")
async def get_profile(
    clerk_user_id: str,
    db = Depends(get_database)
):
    user_service = UserService(db)
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

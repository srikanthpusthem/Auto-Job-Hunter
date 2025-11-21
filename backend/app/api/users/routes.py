from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
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
        # Remove user-level fields from profile data
        profile_update = profile_data.copy()
        profile_update.pop("clerk_user_id", None)
        profile_update.pop("email", None)
        
        await user_service.update_profile(existing_user["_id"], profile_update)
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

@router.post("/resume")
async def upload_resume(
    clerk_user_id: str,
    file: UploadFile = File(...),
    db = Depends(get_database)
):
    user_service = UserService(db)
    
    # Read file content
    content = await file.read()
    
    try:
        result = await user_service.parse_resume(content, file.filename)
        
        # If successful, we might want to save the file URL or text to the profile immediately
        # But for now, we just return the extracted data so the frontend can populate the form
        # and the user can review before saving.
        
        # Optionally update profile with raw text or file metadata if needed
        # await user_service.update_resume_metadata(clerk_user_id, ...)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Resume upload error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during resume parsing")

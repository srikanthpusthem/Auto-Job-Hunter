from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.db.mongo import get_database
from backend.db.repositories import UserRepository
from backend.db.models import UserProfile

router = APIRouter(prefix="/api/users", tags=["users"])

class ProfileRequest(BaseModel):
    clerk_user_id: str
    name: str
    email: str
    skills: list[str]
    experience_years: int
    location: Optional[str] = None
    remote_only: bool = False

@router.post("/profile")
async def create_or_update_profile(
    profile: ProfileRequest,
    db = Depends(get_database)
):
    """Create or update user profile"""
    user_repo = UserRepository(db)
    
    # Check if user exists
    existing_user = await user_repo.find_one({"clerk_user_id": profile.clerk_user_id})
    
    user_profile = UserProfile(
        name=profile.name,
        email=profile.email,
        skills=profile.skills,
        experience_years=profile.experience_years,
        preferences={
            "location": profile.location,
            "remote_only": profile.remote_only
        }
    )
    
    if existing_user:
        # Update existing user
        await user_repo.update(
            existing_user["_id"],
            {
                "profile": user_profile.model_dump(),
                "email": profile.email
            }
        )
        return {"message": "Profile updated", "user_id": existing_user["_id"]}
    else:
        # Create new user
        new_user = await user_repo.create({
            "clerk_user_id": profile.clerk_user_id,
            "email": profile.email,
            "profile": user_profile.model_dump()
        })
        return {"message": "Profile created", "user_id": new_user}

@router.get("/profile/{clerk_user_id}")
async def get_profile(
    clerk_user_id: str,
    db = Depends(get_database)
):
    """Get user profile by Clerk user ID"""
    user_repo = UserRepository(db)
    user = await user_repo.find_one({"clerk_user_id": clerk_user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

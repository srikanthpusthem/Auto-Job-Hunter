from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
import os
import shutil
from pathlib import Path
from backend.db.mongo import get_database
from backend.db.repositories import UserRepository
from backend.db.models import UserProfile
from backend.utils.resume_parser import parse_resume

router = APIRouter(prefix="/api/users", tags=["users"])

class ProfileRequest(BaseModel):
    clerk_user_id: str
    name: str
    email: str
    skills: list[str] = []
    keywords: list[str] = []
    summary: Optional[str] = None
    experience_years: int = 0
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    remote_only: bool = False
    job_types: list[str] = []
    employment_types: list[str] = []
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None

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
        skills=profile.skills,
        keywords=profile.keywords,
        summary=profile.summary,
        experience_years=profile.experience_years,
        linkedin_url=profile.linkedin_url,
        preferences={
            "location": profile.location,
            "remote_only": profile.remote_only,
            "job_types": profile.job_types,
            "employment_types": profile.employment_types,
            "salary_min": profile.salary_min,
            "salary_max": profile.salary_max,
            "salary_currency": profile.salary_currency
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

@router.post("/resume")
async def upload_resume(
    clerk_user_id: str,
    file: UploadFile = File(...),
    db = Depends(get_database)
):
    """Upload and parse resume file"""
    # Validate file type
    allowed_extensions = ['.pdf', '.doc', '.docx']
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size (5MB max)
    file_content = await file.read()
    if len(file_content) > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("backend/uploads/resumes")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = upload_dir / f"{clerk_user_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
    
    try:
        # Parse resume
        parsed_data = parse_resume(str(file_path))
        
        # Get user
        user_repo = UserRepository(db)
        user = await user_repo.find_one({"clerk_user_id": clerk_user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update user profile with parsed data
        profile = user.get("profile", {})
        
        # Merge parsed data with existing profile
        if parsed_data.get("parsed_successfully"):
            # Update skills (merge with existing)
            existing_skills = profile.get("skills", [])
            new_skills = parsed_data.get("skills", [])
            merged_skills = list(set(existing_skills + new_skills))
            
            # Update keywords (merge with existing)
            existing_keywords = profile.get("keywords", [])
            new_keywords = parsed_data.get("keywords", [])
            merged_keywords = list(set(existing_keywords + new_keywords))
            
            # Update summary (use extracted summary if available, otherwise keep existing)
            extracted_summary = parsed_data.get("summary", "")
            if extracted_summary and not profile.get("summary"):
                # Only update if no existing summary
                profile_summary = extracted_summary
            elif extracted_summary:
                # If both exist, prefer extracted (user can edit later)
                profile_summary = extracted_summary
            else:
                profile_summary = profile.get("summary", "")
            
            profile.update({
                "resume_file_url": str(file_path),
                "resume_parsed_text": parsed_data.get("resume_text", ""),
                "resume_text": parsed_data.get("resume_text", ""),
                "skills": merged_skills,
                "keywords": merged_keywords,
                "experience_years": parsed_data.get("experience_years", profile.get("experience_years", 0)),
                "summary": profile_summary
            })
        else:
            # Still save file path even if parsing failed
            profile["resume_file_url"] = str(file_path)
        
        # Update user
        await user_repo.update(user["_id"], {"profile": profile})
        
        return {
            "message": "Resume uploaded successfully",
            "parsed": parsed_data.get("parsed_successfully", False),
            "extracted_data": {
                "skills": parsed_data.get("skills", []),
                "keywords": parsed_data.get("keywords", []),
                "experience_years": parsed_data.get("experience_years", 0),
                "summary": parsed_data.get("summary", "")
            } if parsed_data.get("parsed_successfully") else None
        }
    except Exception as e:
        # Clean up file on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from pydantic import BaseModel
from backend.app.db.mongo import get_database
from backend.app.services.outreach_service import OutreachService
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/api/outreach/templates", tags=["outreach"])

class TemplateCreateRequest(BaseModel):
    clerk_user_id: str
    name: str
    subject: Optional[str] = None
    content: str
    type: str = "email"

class TemplateUpdateRequest(BaseModel):
    clerk_user_id: str
    name: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None

@router.get("")
async def list_templates(
    clerk_user_id: str,
    db = Depends(get_database)
):
    user_service = UserService(db)
    outreach_service = OutreachService(db)
    
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return await outreach_service.list_templates(user["_id"])

@router.get("/{template_id}")
async def get_template(
    template_id: str,
    clerk_user_id: str,
    db = Depends(get_database)
):
    user_service = UserService(db)
    outreach_service = OutreachService(db)
    
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    template = await outreach_service.get_template(template_id, user["_id"])
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    return template

@router.post("")
async def create_template(
    request: TemplateCreateRequest,
    db = Depends(get_database)
):
    user_service = UserService(db)
    outreach_service = OutreachService(db)
    
    user = await user_service.get_user_by_clerk_id(request.clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    template_id = await outreach_service.create_template(user["_id"], request.model_dump())
    return {"id": template_id, "message": "Template created"}

@router.patch("/{template_id}")
async def update_template(
    template_id: str,
    request: TemplateUpdateRequest,
    db = Depends(get_database)
):
    user_service = UserService(db)
    outreach_service = OutreachService(db)
    
    user = await user_service.get_user_by_clerk_id(request.clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    success = await outreach_service.update_template(user["_id"], template_id, request.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(status_code=404, detail="Template not found or update failed")
        
    return {"message": "Template updated"}

@router.post("/{template_id}/duplicate")
async def duplicate_template(
    template_id: str,
    clerk_user_id: str = Body(..., embed=True),
    db = Depends(get_database)
):
    user_service = UserService(db)
    outreach_service = OutreachService(db)
    
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_id = await outreach_service.duplicate_template(user["_id"], template_id)
    if not new_id:
        raise HTTPException(status_code=404, detail="Template not found")
        
    return {"id": new_id, "message": "Template duplicated"}

@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    clerk_user_id: str, # Query param for DELETE usually, or could be body if client supports it. Let's assume query param for simplicity or header.
    # Actually, for DELETE, passing body is discouraged. Let's stick to query param as per typical REST patterns if auth isn't in header.
    # Given previous patterns, I'll accept it as query param here.
    db = Depends(get_database)
):
    user_service = UserService(db)
    outreach_service = OutreachService(db)
    
    user = await user_service.get_user_by_clerk_id(clerk_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    success = await outreach_service.delete_template(user["_id"], template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
        
    return {"message": "Template deleted"}

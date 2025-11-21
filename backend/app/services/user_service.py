from typing import Optional, Dict, Any
from backend.app.db.repositories.user_repository import UserRepository
from backend.app.db.models import User

class UserService:
    def __init__(self, db):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_user_by_clerk_id(self, clerk_user_id: str) -> Optional[Dict[str, Any]]:
        return await self.user_repo.find_one({"clerk_user_id": clerk_user_id})

    async def update_profile(self, user_id: str, profile_data: Dict[str, Any]):
        return await self.user_repo.update(user_id, {"profile": profile_data})
    
    async def create_user(self, user_data: Dict[str, Any]):
        user_id = await self.user_repo.create(user_data)
        
        # Seed default templates
        from backend.app.services.outreach_service import OutreachService
        outreach_service = OutreachService(self.db)
        await outreach_service.create_default_templates(user_id)
        
        return user_id

    async def parse_resume(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Extract text from resume and parse with LLM.
        """
        import io
        from pypdf import PdfReader
        from backend.app.agents.llm_client import llm_client
        import json

        text = ""
        if filename.lower().endswith('.pdf'):
            try:
                pdf = PdfReader(io.BytesIO(file_content))
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
            except Exception as e:
                print(f"Error reading PDF: {e}")
                raise ValueError("Could not read PDF file")
        else:
            # For now only PDF supported properly, or simple text for others
            # TODO: Add docx support if needed
            try:
                text = file_content.decode('utf-8', errors='ignore')
            except:
                raise ValueError("Unsupported file format")

        if not text.strip():
            raise ValueError("No text extracted from resume")

        # Parse with LLM
        prompt = f"""
        You are an expert resume parser. Extract the following information from the resume text below:
        1. Professional Summary (condensed, max 3 sentences)
        2. Top 10 Technical Skills (as a list of strings)
        3. Keywords for Job Search (as a list of strings, e.g. "Senior Python Developer", "Remote", "Startup")
        4. Years of Experience (integer estimate based on work history)

        Resume Text:
        {text[:4000]}  # Truncate to avoid token limits if very long
        """

        json_str = await llm_client.generate_json(prompt, system_message="Extract structured data from resume.")
        try:
            extracted_data = json.loads(json_str)
            return {
                "parsed": True,
                "extracted_data": {
                    "summary": extracted_data.get("Professional Summary") or extracted_data.get("summary"),
                    "skills": extracted_data.get("Top 10 Technical Skills") or extracted_data.get("skills"),
                    "keywords": extracted_data.get("Keywords for Job Search") or extracted_data.get("keywords"),
                    "experience_years": extracted_data.get("Years of Experience") or extracted_data.get("experience_years")
                }
            }
        except Exception as e:
            print(f"Error parsing LLM response: {e}")
            return {"parsed": False, "error": "Failed to parse resume data"}

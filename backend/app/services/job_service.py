from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.app.db.repositories.job_repository import JobRepository
from backend.app.db.repositories.run_repository import RunRepository
from backend.app.db.models import Job

class JobService:
    def __init__(self, db):
        self.db = db
        self.job_repo = JobRepository(db)
        self.run_repo = RunRepository(db)

    async def run_job_scan(self, user_profile: dict, clerk_user_id: str, sources: List[str], match_threshold: float, keywords: List[str] = None, location: str = None, scan_run_id: str = None):
        """Background task to run the LangGraph workflow"""
        # Import agents from new location
        from backend.app.agents.supervisor import supervisor_node
        from backend.app.agents.scout import scout_node
        from backend.app.agents.normalizer import normalizer_node
        from backend.app.agents.profiler import profiler_node
        from backend.app.agents.matcher import matcher_node
        from backend.app.agents.outreach import outreach_node
        from backend.app.agents.reviewer import reviewer_node
        
        # Build search query from keywords and profile
        search_keywords = keywords or []
        if user_profile.get("keywords"):
            search_keywords.extend(user_profile.get("keywords", []))
        if user_profile.get("skills") and not keywords:
            # Use skills as keywords if no keywords provided
            search_keywords.extend(user_profile.get("skills", []))
        
        # Remove duplicates
        search_keywords = list(set(search_keywords))
        
        # Initialize state
        state = {
            "user_profile": user_profile,
            "user_id": clerk_user_id,
            "run_meta": {
                "sources_used": sources or ["google_jobs", "yc"],
                "match_threshold": match_threshold,
                "scan_run_id": scan_run_id
            },
            "run_id": scan_run_id,
            "search_query": {
                "keywords": search_keywords,
                "location": location or user_profile.get("preferences", {}).get("location", "Remote")
            },
            "raw_jobs": [],
            "normalized_jobs": [],
            "matched_jobs": [],
            "outreach_payloads": [],
            "errors": []
        }
        
        try:
            # Run workflow
            sup_result = await supervisor_node(state)
            state.update(sup_result)
            
            scout_result = await scout_node(state)
            state.update(scout_result)
            
            norm_result = await normalizer_node(state)
            state.update(norm_result)
            
            prof_result = await profiler_node(state)
            state.update(prof_result)
            
            match_result = await matcher_node(state)
            state.update(match_result)
            
            out_result = await outreach_node(state)
            state.update(out_result)
            
            rev_result = await reviewer_node(state)
            state.update(rev_result)
            
            # Update scan run with results
            if self.db and scan_run_id:
                await self.run_repo.update(scan_run_id, {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "jobs_found": len(state.get("raw_jobs", [])),
                    "jobs_matched": len(state.get("matched_jobs", []))
                })
            
            print(f"Scan completed. Matched {len(state['matched_jobs'])} jobs.")
            
        except Exception as e:
            print(f"Error during job scan: {e}")
            state["errors"].append(str(e))
            
            # Update scan run with error
            if self.db and scan_run_id:
                await self.run_repo.update(scan_run_id, {
                    "status": "failed",
                    "completed_at": datetime.utcnow(),
                    "error": str(e)
                })

    async def list_jobs(self, filters: Dict[str, Any], limit: int = 50, sort_by: str = "created_at", sort_order: str = "desc"):
        """List matched jobs with filtering and sorting"""
        query = {}
        
        if filters.get("status"):
            query["status"] = filters["status"]
        
        if filters.get("scan_run_id"):
            query["metadata.scan_run_id"] = filters["scan_run_id"]
        
        if filters.get("source"):
            query["source"] = filters["source"]
        
        if filters.get("min_match_score") is not None:
            query["match_score"] = {"$gte": filters["min_match_score"]}
        
        # Date filtering
        date_from = filters.get("date_from")
        date_to = filters.get("date_to")
        if date_from or date_to:
            date_query = {}
            if date_from:
                try:
                    date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                    date_query["$gte"] = date_from_dt
                except:
                    pass
            if date_to:
                try:
                    date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                    date_to_dt = date_to_dt.replace(hour=23, minute=59, second=59)
                    date_query["$lte"] = date_to_dt
                except:
                    pass
            if date_query:
                query["posted_at"] = date_query
        
        # Get jobs
        jobs = await self.job_repo.find_all(query, limit=limit)
        
        # Convert to dicts if needed
        if jobs and not isinstance(jobs[0], dict):
            jobs = [job.model_dump(by_alias=True) if hasattr(job, 'model_dump') else job for job in jobs]
        
        # Sort jobs
        if sort_by == "posted_at":
            jobs.sort(key=lambda x: x.get("posted_at") or datetime.min, reverse=(sort_order == "desc"))
        elif sort_by == "match_score":
            jobs.sort(key=lambda x: x.get("match_score") or 0, reverse=(sort_order == "desc"))
        elif sort_by == "created_at":
            jobs.sort(key=lambda x: x.get("created_at") or x.get("metadata", {}).get("collected_at") or datetime.min, reverse=(sort_order == "desc"))
        
        return jobs

    async def get_job(self, job_id: str):
        return await self.job_repo.find_by_id(job_id)

    async def update_status(self, job_id: str, status: str):
        return await self.job_repo.update(job_id, {"status": status})

    async def generate_outreach(self, job_id: str, user_profile: dict):
        from backend.app.agents.outreach import generate_outreach as gen_outreach
        
        job_data = await self.job_repo.find_by_id(job_id)
        if not job_data:
            return None
        
        job = Job(**job_data)
        
        # Load prompt
        import os
        # Adjust path for new location
        prompt_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "app", "agents", "prompts", "outreach.txt"
        )
        
        # Fallback if file not found (during refactor)
        if not os.path.exists(prompt_path):
             prompt_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
                "agents", "prompts", "outreach.txt"
            )

        with open(prompt_path, "r") as f:
            system_prompt_template = f.read()
        
        result = await gen_outreach(job, user_profile, system_prompt_template)
        return result

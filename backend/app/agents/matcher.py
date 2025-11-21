import json
import os
import asyncio
from backend.app.agents.graph import AgentState
from backend.app.agents.llm_client import llm_client
from backend.app.db.models import Job, JobStatus
from backend.app.utils.timeline import log_step

async def match_job(job: Job, user_profile: dict, system_prompt_template: str) -> Job:
    # Include keywords in user profile for matching
    profile_with_keywords = user_profile.copy()
    if "keywords" not in profile_with_keywords or not profile_with_keywords.get("keywords"):
        # If no keywords in profile, use skills as keywords
        profile_with_keywords["keywords"] = user_profile.get("skills", [])
    
    system_prompt = system_prompt_template.format(
        user_profile=json.dumps(profile_with_keywords, indent=2),
        job_details=job.model_dump_json(include={"title", "company", "description", "remote", "location", "skills_extracted", "tags"})
    )
    
    response = await llm_client.generate_json(
        prompt="Evaluate this job match.",
        system_message=system_prompt
    )
    
    try:
        data = json.loads(response)
        job.match_score = data.get("match_score", 0.0)
        job.match_reasoning = data.get("match_reasoning", "")
        job.missing_skills = data.get("missing_skills", [])
        
        if job.match_score >= 0.7: # Default threshold if not set in run_meta
            job.status = JobStatus.MATCHED
        else:
            job.status = JobStatus.NEW  # Changed from REJECTED to NEW
            
        print(f"Job: {job.title}, Score: {job.match_score:.2f}, Missing: {len(job.missing_skills)} skills")
        return job
    except Exception as e:
        print(f"Error matching job {job.id}: {e}")
        return job

async def matcher_node(state: AgentState):
    print("--- Matching Agent ---")
    user_id = state.get("user_id", "unknown")
    run_id = state.get("run_id")
    normalized_jobs = state.get("normalized_jobs", [])
    
    await log_step(user_id, f"Matcher: Scoring {len(normalized_jobs)} jobs...", run_id=run_id)
    user_profile = state.get("user_profile", {})
    run_meta = state.get("run_meta", {})
    threshold = run_meta.get("match_threshold", 0.7)
    
    # Load prompt
    prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "matcher.txt")
    with open(prompt_path, "r") as f:
        system_prompt_template = f.read()
        
    tasks = [match_job(job, user_profile, system_prompt_template) for job in normalized_jobs]
    scored_jobs = await asyncio.gather(*tasks)
    
    # Filter matched jobs
    matched_jobs = [job for job in scored_jobs if job.match_score >= threshold]
    
    print(f"Matched {len(matched_jobs)} out of {len(normalized_jobs)} jobs.")
    
    return {"matched_jobs": matched_jobs}

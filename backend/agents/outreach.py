import json
import os
import asyncio
from backend.agents.graph import AgentState
from backend.agents.llm_client import llm_client
from backend.db.models import Job

async def generate_outreach(job: Job, user_profile: dict, system_prompt_template: str) -> dict:
    system_prompt = system_prompt_template.format(
        user_profile=json.dumps(user_profile, indent=2),
        job_details=job.model_dump_json(include={"title", "company", "description"})
    )
    
    response = await llm_client.generate_json(
        prompt="Generate outreach messages.",
        system_message=system_prompt
    )
    
    try:
        data = json.loads(response)
        job.outreach_email_subject = data.get("email_subject")
        job.outreach_email_body = data.get("email_body")
        job.outreach_linkedin_dm = data.get("linkedin_dm")
        
        return {
            "job_id": job.id,
            "email_subject": job.outreach_email_subject,
            "email_body": job.outreach_email_body,
            "linkedin_dm": job.outreach_linkedin_dm
        }
    except Exception as e:
        print(f"Error generating outreach for job {job.id}: {e}")
        return None

async def outreach_node(state: AgentState):
    print("--- Outreach Agent ---")
    matched_jobs = state.get("matched_jobs", [])
    user_profile = state.get("user_profile", {})
    
    # Load prompt
    prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "outreach.txt")
    with open(prompt_path, "r") as f:
        system_prompt_template = f.read()
        
    tasks = [generate_outreach(job, user_profile, system_prompt_template) for job in matched_jobs]
    results = await asyncio.gather(*tasks)
    
    outreach_payloads = [res for res in results if res is not None]
    
    print(f"Generated outreach for {len(outreach_payloads)} jobs.")
    
    return {"outreach_payloads": outreach_payloads, "matched_jobs": matched_jobs}

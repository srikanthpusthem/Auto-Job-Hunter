import json
import os
import asyncio
from backend.app.agents.graph import AgentState
from backend.app.agents.llm_client import llm_client
from backend.app.db.models import Job, OutreachContent

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
        # Update nested outreach content
        job.outreach = OutreachContent(
            email_subject=data.get("email_subject"),
            email_body=data.get("email_body"),
            linkedin_dm=data.get("linkedin_dm")
        )
        
        return {
            "job_id": job.id,
            "email_subject": job.outreach.email_subject,
            "email_body": job.outreach.email_body,
            "linkedin_dm": job.outreach.linkedin_dm
        }
    except Exception as e:
        print(f"Error generating outreach for job {job.id}: {e}")
        return None

async def outreach_node(state: AgentState):
    print("--- Outreach Agent ---")
    user_id = state.get("user_id", "unknown")
    run_id = state.get("run_id")
    matched_jobs = state.get("matched_jobs", [])
    
    await log_step(user_id, f"Outreach: Generating messages for {len(matched_jobs)} matches...", run_id=run_id)
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

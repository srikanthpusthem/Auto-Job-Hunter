import asyncio
import sys
import os

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.agents.graph import AgentState
from backend.agents.supervisor import supervisor_node
from backend.agents.scout import scout_node
from backend.agents.normalizer import normalizer_node
from backend.agents.profiler import profiler_node
from backend.agents.matcher import matcher_node
from backend.agents.outreach import outreach_node
from backend.agents.reviewer import reviewer_node
from backend.db.mongo import db

async def run_full_flow():
    # Connect to DB
    db.connect()
    
    # Initial State
    state = {
        "user_profile": {
            "name": "Test User",
            "skills": ["Python", "FastAPI", "React"],
            "preferences": {
                "remote_only": True,
                "locations": ["United States"]
            }
        },
        "run_meta": {},
        "search_query": {},
        "raw_jobs": [],
        "normalized_jobs": [],
        "matched_jobs": [],
        "outreach_payloads": [],
        "errors": []
    }
    
    # 1. Supervisor
    print("\n--- Step 1: Supervisor ---")
    sup_result = await supervisor_node(state)
    state.update(sup_result)
    
    # FORCE OVERRIDE for testing purposes
    state["run_meta"]["sources_used"] = ["google_jobs", "yc"]
    state["run_meta"]["match_threshold"] = 0.5
    print(f"DEBUG: Forced sources: {state['run_meta']['sources_used']}")
    print(f"DEBUG: Forced threshold: {state['run_meta']['match_threshold']}")
    
    # 2. Scout
    print("\n--- Step 2: Scout ---")
    scout_result = await scout_node(state)
    state.update(scout_result)
    
    # 3. Normalizer
    print("\n--- Step 3: Normalizer ---")
    norm_result = await normalizer_node(state)
    state.update(norm_result)
    for job in state['normalized_jobs']:
        print(f"Normalized: {job.title}, Remote: {job.remote}, Location: {job.location}")
    
    # 4. Profiler
    print("\n--- Step 4: Profiler ---")
    prof_result = await profiler_node(state)
    state.update(prof_result)
    
    # 5. Matcher
    print("\n--- Step 5: Matcher ---")
    print(f"Threshold: {state['run_meta'].get('match_threshold')}")
    match_result = await matcher_node(state)
    state.update(match_result)
    
    # 6. Outreach
    print("\n--- Step 6: Outreach ---")
    out_result = await outreach_node(state)
    state.update(out_result)
    
    # 7. Reviewer
    print("\n--- Step 7: Reviewer ---")
    rev_result = await reviewer_node(state)
    state.update(rev_result)
    
    print("\n--- Final Result ---")
    print(f"Saved {len(state['matched_jobs'])} jobs to DB.")
    for job in state['matched_jobs']:
        print(f"Title: {job.title}")
        print(f"Score: {job.match_score}")
        print(f"Subject: {job.outreach.email_subject}")
        print("-" * 20)
        
    db.close()

if __name__ == "__main__":
    asyncio.run(run_full_flow())

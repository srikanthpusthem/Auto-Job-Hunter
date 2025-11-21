import asyncio
from backend.app.agents.graph import AgentState
from backend.app.utils.timeline import log_step
from backend.app.agents.tools_sources import (
    search_google_jobs_serpapi,
    fetch_yc_jobs,
    fetch_wellfound_jobs,
    search_linkedin_playwright,
    search_indeed_playwright
)

async def scout_node(state: AgentState):
    print("--- Scout Agent ---")
    user_id = state.get("user_id", "unknown")
    run_id = state.get("run_id")
    await log_step(user_id, "Scout Agent: Starting job search across sources...", run_id=run_id)
    
    run_meta = state.get("run_meta", {})
    sources = run_meta.get("sources_used", [])
    search_query = state.get("search_query", {})
    
    keywords = search_query.get("keywords", [])
    location = search_query.get("location", "Remote")
    query_str = " ".join(keywords)
    
    tasks = []
    
    if "google_jobs" in sources:
        await log_step(user_id, "Scout: Searching Google Jobs...", run_id=run_id)
        tasks.append(search_google_jobs_serpapi(query_str, location))
        
    if "yc" in sources:
        await log_step(user_id, "Scout: Fetching YC Jobs...", run_id=run_id)
        tasks.append(fetch_yc_jobs(query_str))
        
    if "wellfound" in sources:
        await log_step(user_id, "Scout: Fetching Wellfound Jobs...", run_id=run_id)
        tasks.append(fetch_wellfound_jobs(query_str))
        
    if "linkedin" in sources:
        await log_step(user_id, "Scout: Searching LinkedIn...", run_id=run_id)
        tasks.append(search_linkedin_playwright(query_str))
        
    if "indeed" in sources:
        await log_step(user_id, "Scout: Searching Indeed...", run_id=run_id)
        tasks.append(search_indeed_playwright(query_str))
        
    results = await asyncio.gather(*tasks)
    
    # Flatten results
    raw_jobs = []
    for result_list in results:
        raw_jobs.extend(result_list)
        
    print(f"Scout found {len(raw_jobs)} raw jobs.")
    await log_step(user_id, f"Scout: Found {len(raw_jobs)} raw jobs.", run_id=run_id)
    
    return {"raw_jobs": raw_jobs}

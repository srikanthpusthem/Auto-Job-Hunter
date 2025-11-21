import asyncio
from backend.app.agents.graph import AgentState
from backend.app.agents.tools_sources import (
    search_google_jobs_serpapi,
    fetch_yc_jobs,
    fetch_wellfound_jobs,
    search_linkedin_playwright,
    search_indeed_playwright
)

async def scout_node(state: AgentState):
    print("--- Scout Agent ---")
    run_meta = state.get("run_meta", {})
    sources = run_meta.get("sources_used", [])
    search_query = state.get("search_query", {})
    
    keywords = search_query.get("keywords", [])
    location = search_query.get("location", "Remote")
    query_str = " ".join(keywords)
    
    tasks = []
    
    if "google_jobs" in sources:
        tasks.append(search_google_jobs_serpapi(query_str, location))
        
    if "yc" in sources:
        tasks.append(fetch_yc_jobs(query_str))
        
    if "wellfound" in sources:
        tasks.append(fetch_wellfound_jobs(query_str))
        
    if "linkedin" in sources:
        tasks.append(search_linkedin_playwright(query_str))
        
    if "indeed" in sources:
        tasks.append(search_indeed_playwright(query_str))
        
    results = await asyncio.gather(*tasks)
    
    # Flatten results
    raw_jobs = []
    for result_list in results:
        raw_jobs.extend(result_list)
        
    print(f"Scout found {len(raw_jobs)} raw jobs.")
    
    return {"raw_jobs": raw_jobs}

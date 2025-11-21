import json
import os
from backend.agents.graph import AgentState
from backend.agents.llm_client import llm_client

async def supervisor_node(state: AgentState):
    print("--- Supervisor Agent ---")
    user_profile = state.get("user_profile", {})
    
    # Load prompt
    prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "supervisor.txt")
    with open(prompt_path, "r") as f:
        system_prompt_template = f.read()
        
    system_prompt = system_prompt_template.format(user_profile=json.dumps(user_profile, indent=2))
    
    # Generate configuration
    response = await llm_client.generate_json(
        prompt="Plan the job search.",
        system_message=system_prompt
    )
    
    try:
        config = json.loads(response)
    except json.JSONDecodeError:
        print("Error decoding Supervisor response")
        config = {
            "sources": ["google_jobs"],
            "match_threshold": 0.7,
            "search_filters": {}
        }
        
    # Update state
    return {
        "run_meta": {
            "sources_used": config.get("sources", []),
            "match_threshold": config.get("match_threshold", 0.7)
        },
        "search_query": config.get("search_filters", {})
    }

import json
import os
from backend.agents.graph import AgentState
from backend.agents.llm_client import llm_client

async def profiler_node(state: AgentState):
    print("--- Resume Profiler Agent ---")
    user_profile = state.get("user_profile", {})
    
    # Load prompt
    prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "profiler.txt")
    with open(prompt_path, "r") as f:
        system_prompt_template = f.read()
        
    system_prompt = system_prompt_template.format(user_profile=json.dumps(user_profile, indent=2))
    
    response = await llm_client.generate_json(
        prompt="Analyze and refine the user profile.",
        system_message=system_prompt
    )
    
    try:
        refined_data = json.loads(response)
        # Update user profile with refined data
        user_profile.update(refined_data)
    except Exception as e:
        print(f"Error profiling user: {e}")
        
    return {"user_profile": user_profile}

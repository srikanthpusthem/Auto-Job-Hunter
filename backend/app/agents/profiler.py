import json
import os

from backend.app.agents.graph import AgentState
from backend.app.agents.llm_client import llm_client
from backend.app.utils.timeline import log_step


async def profiler_node(state: AgentState):
    print("--- Resume Profiler Agent ---")
    user_id = state.get("user_id", "unknown")
    run_id = state.get("run_id")
    await log_step(user_id, "Profiler: Analyzing user profile and resume...", run_id=run_id)

    user_profile = state.get("user_profile", {})

    prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "profiler.txt")
    with open(prompt_path, "r") as f:
        system_prompt_template = f.read()

    system_prompt = system_prompt_template.format(user_profile=json.dumps(user_profile, indent=2))

    response = await llm_client.generate_json(
        prompt="Analyze and refine the user profile.",
        system_message=system_prompt,
    )

    try:
        refined_data = json.loads(response)
        user_profile.update(refined_data)
        state["user_profile"] = user_profile
    except Exception as e:
        print(f"Error profiling user: {e}")

    return {"user_profile": user_profile}

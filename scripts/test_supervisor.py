import asyncio
import sys
import os

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.agents.supervisor import supervisor_node

async def main():
    mock_state = {
        "user_profile": {
            "name": "Test User",
            "skills": ["Python", "FastAPI", "React"],
            "preferences": {
                "remote_only": True,
                "locations": ["United States"]
            }
        }
    }
    
    print("Running Supervisor Node...")
    result = await supervisor_node(mock_state)
    print("\nResult:")
    print(result)

if __name__ == "__main__":
    asyncio.run(main())

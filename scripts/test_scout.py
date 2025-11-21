import asyncio
import sys
import os

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.agents.scout import scout_node

async def main():
    mock_state = {
        "run_meta": {
            "sources_used": ["google_jobs", "yc"]
        },
        "search_query": {
            "keywords": ["python", "fastapi"],
            "location": "Remote"
        }
    }
    
    print("Running Scout Node...")
    result = await scout_node(mock_state)
    print("\nResult:")
    print(f"Found {len(result['raw_jobs'])} jobs")
    for job in result['raw_jobs']:
        print(f"- {job.get('title', job.get('company'))}")

if __name__ == "__main__":
    asyncio.run(main())

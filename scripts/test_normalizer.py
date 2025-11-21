import asyncio
import sys
import os

# Add the project root to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.agents.normalizer import normalizer_node

async def main():
    mock_state = {
        "raw_jobs": [
            {
                "title": "Senior Python Developer",
                "company_name": "Tech Corp",
                "location": "Remote",
                "description": "We are looking for a Python expert with FastAPI experience.",
                "via": "Google Jobs",
                "listing_url": "https://example.com/job/1",
                "detected_extensions": {"posted_at": "1 day ago", "schedule_type": "Full-time"}
            },
            {
                "title": "Founding Engineer",
                "company": "NextBigThing",
                "location": "San Francisco",
                "description": "Build the future of work.",
                "url": "https://ycombinator.com/jobs/123"
            }
        ]
    }
    
    print("Running Normalizer Node...")
    result = await normalizer_node(mock_state)
    print("\nResult:")
    print(f"Normalized {len(result['normalized_jobs'])} jobs")
    for job in result['normalized_jobs']:
        print(f"- {job.title} at {job.company} ({job.location})")

if __name__ == "__main__":
    asyncio.run(main())

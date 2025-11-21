"""
Test script to verify real job scrapers are working.
Run this to test each scraper function individually.
"""
import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.agents.tools_sources import (
    search_google_jobs_serpapi,
    fetch_yc_jobs,
    search_linkedin_playwright,
    search_indeed_playwright
)


async def test_scrapers():
    """Test all scraper functions"""
    
    print("=" * 60)
    print("TESTING JOB SCRAPERS")
    print("=" * 60)
    
    query = "python developer"
    location = "San Francisco"
    
    # Test Google Jobs (SerpAPI)
    print("\n1. Testing Google Jobs (SerpAPI)...")
    google_jobs = await search_google_jobs_serpapi(query, location)
    print(f"   Found {len(google_jobs)} jobs")
    if google_jobs:
        print(f"   Sample: {google_jobs[0].get('title')} at {google_jobs[0].get('company_name')}")
    
    # Test YC Jobs
    print("\n2. Testing YC Jobs...")
    yc_jobs = await fetch_yc_jobs(query)
    print(f"   Found {len(yc_jobs)} jobs")
    if yc_jobs:
        print(f"   Sample: {yc_jobs[0].get('title')} at {yc_jobs[0].get('company')}")
    
    # Test LinkedIn (Playwright)
    print("\n3. Testing LinkedIn (Playwright)...")
    linkedin_jobs = await search_linkedin_playwright(query)
    print(f"   Found {len(linkedin_jobs)} jobs")
    if linkedin_jobs:
        print(f"   Sample: {linkedin_jobs[0].get('title')} at {linkedin_jobs[0].get('company')}")
    
    # Test Indeed (Playwright)
    print("\n4. Testing Indeed (Playwright)...")
    indeed_jobs = await search_indeed_playwright(query)
    print(f"   Found {len(indeed_jobs)} jobs")
    if indeed_jobs:
        print(f"   Sample: {indeed_jobs[0].get('title')} at {indeed_jobs[0].get('company')}")
    
    print("\n" + "=" * 60)
    print(f"TOTAL JOBS FOUND: {len(google_jobs) + len(yc_jobs) + len(linkedin_jobs) + len(indeed_jobs)}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_scrapers())

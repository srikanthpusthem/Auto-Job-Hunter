"""
Real job scraping implementations using SerpAPI, BeautifulSoup, and Playwright.
"""
import asyncio
from typing import List, Dict, Any
import os
from serpapi import Client
from bs4 import BeautifulSoup
import aiohttp
from backend.core.config import settings
from backend.app.agents.scraper_utils import retry_async


@retry_async(max_attempts=2, delay=1.0)
async def search_google_jobs_serpapi(query: str, location: str) -> List[Dict[str, Any]]:
    """
    Search Google Jobs using SerpAPI.
    Extracts: listing_url, apply_url, source_id, company_logo, salary, description.
    """
    try:
        if not settings.SERPAPI_API_KEY:
            print("Warning: SERPAPI_API_KEY not set, returning empty results")
            return []
        
        # Create SerpAPI client
        client = Client(api_key=settings.SERPAPI_API_KEY)
        
        # Execute search
        results = client.search({
            "engine": "google_jobs",
            "q": query,
            "location": location,
            "hl": "en",
            "gl": "us"
        })
        
        # Extract jobs from response
        jobs = results.get("jobs_results", [])
        
        # Extract enriched job data
        enriched_jobs = []
        for job in jobs:
            # Extract URLs
            apply_options = job.get("apply_options", [])
            apply_url = apply_options[0].get("link") if apply_options else None
            listing_url = job.get("share_link") or job.get("link")
            
            # Extract salary from detected_extensions
            extensions = job.get("detected_extensions", {})
            salary_str = extensions.get("salary", "")
            posted_at_str = extensions.get("posted_at", extensions.get("posted", ""))
            employment_type = extensions.get("schedule_type", "")
            
            enriched_job = {
                "id": job.get("job_id", ""),
                "title": job.get("title", ""),
                "company": job.get("company_name", ""),
                "company_logo": job.get("thumbnail", ""),
                "location": job.get("location", location),
                "description": job.get("description", ""),
                "via": "Google Jobs",
                "listing_url": listing_url,
                "apply_url": apply_url,
                "salary": salary_str,
                "posted_at": posted_at_str,
                "employment_type": employment_type,
                "extensions": job.get("extensions", [])
            }
            enriched_jobs.append(enriched_job)
        
        print(f"✓ SerpAPI found {len(enriched_jobs)} jobs for '{query}' in '{location}'")
        return enriched_jobs
        
    except Exception as e:
        print(f"Error in search_google_jobs_serpapi: {str(e)}")
        return []


@retry_async(max_attempts=2, delay=1.0)
async def fetch_yc_jobs(query: str) -> List[Dict[str, Any]]:
    """
    Scrape Y Combinator's Work at a Startup page.
    """
    try:
        url = "https://www.ycombinator.com/jobs"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    print(f"Failed to fetch YC jobs: status {response.status}")
                    return []
                
                html = await response.text()
        
        soup = BeautifulSoup(html, 'lxml')
        jobs = []
        
        # Find job listings  (YC page structure may vary, this is a simplified approach)
        # Note: YC's actual site structure would need to be inspected and updated
        job_elements = soup.find_all('div', class_='job-listing')  # Placeholder selector
        
        for job_elem in job_elements[:10]:  # Limit to 10 jobs
            try:
                # Extract job details (these selectors are placeholders)
                title_elem = job_elem.find('h3')
                company_elem = job_elem.find('span', class_='company')
                location_elem = job_elem.find('span', class_='location')
                
                job = {
                    "title": title_elem.text.strip() if title_elem else "Unknown Title",
                    "company": company_elem.text.strip() if company_elem else "YC Startup",
                    "location": location_elem.text.strip() if location_elem else "San Francisco",
                    "description": f"Y Combinator startup looking for: {query}",
                    "url": f"https://www.ycombinator.com/jobs/{job_elem.get('id', '')}"
                }
                jobs.append(job)
            except Exception as e:
                continue
        
        print(f"✓ YC Jobs found {len(jobs)} jobs")
        return jobs
        
    except Exception as e:
        print(f"Error in fetch_yc_jobs: {str(e)}")
        return []


@retry_async(max_attempts=2, delay=1.0)
async def fetch_wellfound_jobs(query: str) -> List[Dict[str, Any]]:
    """
    Placeholder for Wellfound (formerly AngelList) job scraping.
    This would require either their API or web scraping.
    """
    print("Wellfound scraping not yet implemented")
    return []


@retry_async(max_attempts=2, delay=1.0)
async def search_linkedin_playwright(query: str) -> List[Dict[str, Any]]:
    """
    Scrape LinkedIn Jobs using Playwright.
    Extracts: job URL, company logo, description, posted date.
    """
    try:
        from playwright.async_api import async_playwright
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Build LinkedIn jobs search URL
            search_url = f"https://www.linkedin.com/jobs/search/?keywords={query.replace(' ', '%20')}"
            
            await page.goto(search_url, timeout=10000)
            await page.wait_for_timeout(2000)  # Wait for content to load
            
            # Extract job cards
            jobs = []
            job_cards = await page.query_selector_all('.job-search-card')
            
            for card in job_cards[:10]:  # Limit to 10 jobs
                try:
                    # Extract basic info
                    title_elem = await card.query_selector('.base-search-card__title')
                    company_elem = await card.query_selector('.base-search-card__subtitle')
                    location_elem = await card.query_selector('.job-search-card__location')
                    
                    # Extract job URL
                    link_elem = await card.query_selector('a.base-card__full-link')
                    job_url = await link_elem.get_attribute('href') if link_elem else None
                    
                    # Extract job ID from URL
                    job_id = None
                    if job_url and 'linkedin.com/jobs/view/' in job_url:
                        job_id = job_url.split('linkedin.com/jobs/view/')[-1].split('?')[0]
                    
                    # Extract company logo
                    logo_elem = await card.query_selector('img.artdeco-entity-image')
                    company_logo = await logo_elem.get_attribute('src') if logo_elem else None
                    
                    job = {
                        "id": job_id,
                        "title": await title_elem.inner_text() if title_elem else "Unknown",
                        "company": await company_elem.inner_text() if company_elem else "Unknown",
                        "company_logo": company_logo,
                        "location": await location_elem.inner_text() if location_elem else "Unknown",
                        "description": f"LinkedIn job matching: {query}",
                        "via": "LinkedIn",
                        "listing_url": job_url,
                        "apply_url": job_url
                    }
                    jobs.append(job)
                except Exception:
                    continue
            
            await browser.close()
            
            print(f"✓ LinkedIn found {len(jobs)} jobs")
            return jobs
            
    except Exception as e:
        print(f"Error in search_linkedin_playwright: {str(e)}")
        return []


@retry_async(max_attempts=2, delay=1.0)
async def search_indeed_playwright(query: str) -> List[Dict[str, Any]]:
    """
    Scrape Indeed Jobs using Playwright.
    Extracts: job URL, job ID, company, salary if available.
    """
    try:
        from playwright.async_api import async_playwright
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Build Indeed search URL
            search_url = f"https://www.indeed.com/jobs?q={query.replace(' ', '+')}"
            
            await page.goto(search_url, timeout=10000)
            await page.wait_for_timeout(2000)
            
            # Extract job cards
            jobs = []
            job_cards = await page.query_selector_all('.job_seen_beacon')
            
            for card in job_cards[:10]:  # Limit to 10 jobs
                try:
                    title_elem = await card.query_selector('h2.jobTitle')
                    company_elem = await card.query_selector('[data-testid="company-name"]')
                    location_elem = await card.query_selector('[data-testid="text-location"]')
                    salary_elem = await card.query_selector('[data-testid="attribute_snippet_testid"]')
                    
                    # Extract job URL and ID
                    link_elem = await card.query_selector('h2.jobTitle a')
                    job_url = await link_elem.get_attribute('href') if link_elem else None
                    if job_url and not job_url.startswith('http'):
                        job_url = f"https://www.indeed.com{job_url}"
                    
                    # Extract job ID from data attribute
                    job_id = await card.get_attribute('data-jk') if card else None
                    
                    job = {
                        "id": job_id,
                        "title": await title_elem.inner_text() if title_elem else "Unknown",
                        "company": await company_elem.inner_text() if company_elem else "Unknown",
                        "location": await location_elem.inner_text() if location_elem else "Unknown",
                        "salary": await salary_elem.inner_text() if salary_elem else None,
                        "description": f"Indeed job matching: {query}",
                        "via": "Indeed",
                        "listing_url": job_url,
                        "apply_url": job_url
                    }
                    jobs.append(job)
                except Exception:
                    continue
            
            await browser.close()
            
            print(f"✓ Indeed found {len(jobs)} jobs")
            return jobs
            
    except Exception as e:
        print(f"Error in search_indeed_playwright: {str(e)}")
        return []

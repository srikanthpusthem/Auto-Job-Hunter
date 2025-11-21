import json
import os
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from backend.agents.graph import AgentState
from backend.agents.llm_client import llm_client
from backend.db.models import Job, JobMetadata, SalaryInfo, OutreachContent
from backend.agents.normalization_utils import (
    normalize_company_name,
    normalize_title,
    parse_salary,
    parse_posted_date,
    extract_tags,
    extract_skills,
    generate_fingerprint,
    is_valid_job
)


async def normalize_job_batch(raw_jobs: List[Dict[str, Any]], system_prompt_template: str) -> Dict[str, Any]:
    """
    Use LLM to normalize a batch of jobs, then apply Python validation.
    """
    system_prompt = system_prompt_template.format(raw_jobs=json.dumps(raw_jobs, indent=2))
    
    response = await llm_client.generate_json(
        prompt="Normalize these job listings according to the schema.",
        system_message=system_prompt
    )
    
    try:
        result = json.loads(response)
        return result
    except Exception as e:
        print(f"Error parsing LLM response: {e}")
        return {"normalized_jobs": [], "discarded_count": len(raw_jobs), "discard_reasons": ["llm_parse_error"] * len(raw_jobs)}


def finalize_job(normalized_job: Dict[str, Any], raw_job: Dict[str, Any], source: str) -> Job:
    """
    Apply Python-level validation and create Job model with metadata.
    """
    # Validate required fields
    is_valid, error_reason = is_valid_job(normalized_job)
    if not is_valid:
        raise ValueError(f"Invalid job: {error_reason}")
    
    # Ensure apply_url is set
    if not normalized_job.get('apply_url') and normalized_job.get('listing_url'):
        normalized_job['apply_url'] = normalized_job['listing_url']
    
    # Additional normalization
    if normalized_job.get('company'):
        normalized_job['company'] = normalize_company_name(normalized_job['company'])
    
    if normalized_job.get('title'):
        normalized_job['title'] = normalize_title(normalized_job['title'])
    
    # Generate fingerprint
    fingerprint = generate_fingerprint(
        normalized_job.get('title', ''),
        normalized_job.get('company', ''),
        normalized_job.get('source_id', ''),
        normalized_job.get('location', '')
    )
    
    # Create metadata
    metadata = JobMetadata(
        fingerprint=fingerprint,
        scraped_from=source,
        raw_payload=raw_job
    )
    
    # Create Job model
    job_data = {
        "_id": normalized_job.get('source_id') or fingerprint,
        "source": source,
        "source_id": normalized_job.get('source_id'),
        "title": normalized_job['title'],
        "company": normalized_job.get('company'),
        "company_logo": normalized_job.get('company_logo'),
        "location": normalized_job.get('location'),
        "remote": normalized_job.get('remote', False),
        "job_type": normalized_job.get('job_type'),
        "employment_type": normalized_job.get('employment_type'),
        "salary": SalaryInfo(**normalized_job.get('salary', {})),
        "posted_at": parse_posted_date(normalized_job.get('posted_at')) if normalized_job.get('posted_at') else None,
        "description": normalized_job.get('description'),
        "listing_url": normalized_job.get('listing_url'),
        "apply_url": normalized_job.get('apply_url'),
        "tags": normalized_job.get('tags', []),
        "skills_extracted": normalized_job.get('skills_extracted', []),
        "metadata": metadata,
        "outreach": OutreachContent()
    }
    
    return Job(**job_data)


async def normalizer_node(state: AgentState):
    """
    Normalize raw jobs using LLM + Python validation.
    Enforces production schema with strict URL requirements.
    """
    print("--- Job Normalizer Agent ---")
    raw_jobs = state.get("raw_jobs", [])
    
    if not raw_jobs:
        print("No raw jobs to normalize.")
        return {"normalized_jobs": []}
    
    # Load prompt
    prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "normalizer.txt")
    with open(prompt_path, "r") as f:
        system_prompt_template = f.read()
    
    # Process jobs in batches for efficiency (batch of 10)
    batch_size = 10
    all_normalized = []
    total_discarded = 0
    discard_reasons = []
    
    for i in range(0, len(raw_jobs), batch_size):
        batch = raw_jobs[i:i+batch_size]
        
        # Get LLM normalization
        llm_result = await normalize_job_batch(batch, system_prompt_template)
        
        # Finalize each job with Python validation
        for idx, normalized_job in enumerate(llm_result.get("normalized_jobs", [])):
            try:
                # Determine source from raw_job
                raw_job = batch[idx] if idx < len(batch) else {}
                source = raw_job.get('via', 'unknown').lower().replace(' ', '_')
                if 'google' in source:
                    source = 'google_jobs'
                elif 'linkedin' in source:
                    source = 'linkedin'
                elif 'indeed' in source:
                    source = 'indeed'
                
                job = finalize_job(normalized_job, raw_job, source)
                all_normalized.append(job)
            except Exception as e:
                print(f"Failed to finalize job: {e}")
                total_discarded += 1
                discard_reasons.append(str(e))
        
        # Add LLM discarded count
        total_discarded += llm_result.get("discarded_count", 0)
        discard_reasons.extend(llm_result.get("discard_reasons", []))
    
    print(f"Normalized {len(all_normalized)} jobs.")
    print(f"Discarded {total_discarded} jobs. Reasons: {set(discard_reasons)}")
    
    return {"normalized_jobs": all_normalized}

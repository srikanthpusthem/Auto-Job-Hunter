from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from enum import Enum

class JobStatus(str, Enum):
    NEW = "new"
    MATCHED = "matched"
    APPLIED = "applied"
    REJECTED = "rejected"
    INTERVIEW = "interview"
    OFFER = "offer"

class UserProfile(BaseModel):
    name: str
    skills: List[str] = []
    keywords: List[str] = []  # Search keywords for job matching
    experience_years: int = 0
    resume_text: Optional[str] = None
    resume_file_url: Optional[str] = None  # URL/path to uploaded resume file
    resume_parsed_text: Optional[str] = None  # Extracted text from resume
    linkedin_url: Optional[str] = None
    summary: Optional[str] = None  # Professional summary/bio
    education: List[Dict[str, Any]] = []  # Education history
    work_experience: List[Dict[str, Any]] = []  # Work experience details
    preferences: Dict[str, Any] = {}  # Location, remote, job_types, employment_types, salary

class User(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    profile: UserProfile = UserProfile(name="")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SalaryInfo(BaseModel):
    """Structured salary information"""
    min: Optional[float] = None
    max: Optional[float] = None
    currency: Optional[str] = None  # USD, EUR, GBP, etc.
    interval: Optional[str] = None  # year | month | hour

class OutreachContent(BaseModel):
    """Generated outreach messages"""
    email_subject: Optional[str] = None
    email_body: Optional[str] = None
    linkedin_dm: Optional[str] = None

class JobMetadata(BaseModel):
    """Metadata for tracking and deduplication"""
    collected_at: datetime = Field(default_factory=datetime.utcnow)
    scraped_from: Optional[str] = None
    fingerprint: str  # hash(title + company + source_id + location)
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
    scan_run_id: Optional[str] = None  # ID of the scan run that found this job

class Job(BaseModel):
    """
    Production-ready unified job schema.
    All jobs must have listing_url or apply_url to be valid.
    """
    id: str = Field(alias="_id")
    source: str  # google_jobs | linkedin | indeed | yc | wellfound
    source_id: Optional[str] = None
    
    # Core fields
    title: str
    company: Optional[str] = None
    company_logo: Optional[str] = None
    location: Optional[str] = None
    remote: bool = False
    job_type: Optional[str] = None  # e.g., "Engineering", "Design"
    employment_type: Optional[str] = None  # full-time | contract | intern | part-time
    
    # Salary
    salary: SalaryInfo = Field(default_factory=SalaryInfo)
    
    # Content
    posted_at: Optional[datetime] = None
    description: Optional[str] = None
    
    # URLs (at least one required for valid job)
    listing_url: Optional[str] = None
    apply_url: Optional[str] = None
    
    # Enrichment
    tags: List[str] = Field(default_factory=list)
    skills_extracted: List[str] = Field(default_factory=list)
    
    # Matching
    match_score: Optional[float] = None
    match_reasoning: Optional[str] = None
    missing_skills: List[str] = Field(default_factory=list)
    status: JobStatus = JobStatus.NEW
    
    # Outreach
    outreach: OutreachContent = Field(default_factory=OutreachContent)
    
    # Metadata
    metadata: JobMetadata
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "_id": "abc123",
                "source": "google_jobs",
                "source_id": "job_xyz",
                "title": "Senior Python Developer",
                "company": "Tech Corp",
                "company_logo": "https://example.com/logo.png",
                "location": "San Francisco, CA",
                "remote": True,
                "employment_type": "full-time",
                "salary": {
                    "min": 120000,
                    "max": 180000,
                    "currency": "USD",
                    "interval": "year"
                },
                "listing_url": "https://example.com/job/123",
                "apply_url": "https://example.com/apply/123",
                "tags": ["senior", "python", "remote", "full-time"],
                "skills_extracted": ["Python", "FastAPI", "React"],
                "metadata": {
                    "fingerprint": "abc123def456",
                    "collected_at": "2025-11-20T20:00:00Z"
                }
            }
        }

class ScanRun(BaseModel):
    id: str = Field(alias="_id")
    status: str = "pending" # pending, running, completed, failed
    sources: List[str] = []
    jobs_found: int = 0
    jobs_matched: int = 0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error: Optional[str] = None

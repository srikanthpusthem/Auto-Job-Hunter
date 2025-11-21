# normalization_utils.py
"""Utility functions used by the Job Normalizer Agent.
These helpers perform deterministic transformations that are easier to test in Python than in LLM prompts.
"""
import re
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple

# ---------------------------------------------------------------------------
# Company & Title Normalization
# ---------------------------------------------------------------------------
COMPANY_SUFFIXES = ["inc", "llc", "ltd", "corp", "corporation", "co.", "co"]

def normalize_company_name(name: str) -> str:
    """Remove common corporate suffixes and trim whitespace.
    Example: "Acme Inc." -> "Acme"
    """
    if not name:
        return name
    name = name.strip()
    # Remove punctuation at the end
    name = re.sub(r"[,.]$", "", name)
    parts = name.split()
    # Drop suffixes if they appear at the end
    while parts and parts[-1].lower().strip('.').strip() in COMPANY_SUFFIXES:
        parts.pop()
    return " ".join(parts)

def normalize_title(title: str) -> str:
    """Trim whitespace and remove surrounding brackets.
    Example: "[Senior Engineer]" -> "Senior Engineer"
    """
    if not title:
        return title
    title = title.strip()
    # Remove leading/trailing brackets or parentheses
    title = re.sub(r"^[\[\(]+|[\]\)]+$", "", title)
    return title

# ---------------------------------------------------------------------------
# Salary Parsing
# ---------------------------------------------------------------------------
SALARY_REGEX = re.compile(r"(?P<currency>[$€£])?\s*(?P<min>\d+[kK]?)\s*(?:[-–to]+\s*(?P<max>\d+[kK]?))?\s*(?P<interval>per\s+\w+)?", re.IGNORECASE)

def parse_salary(salary_str: str) -> Dict[str, Any]:
    """Parse a salary string into a structured dict.
    Supports formats like "$100k-$150k per year" or "€80k".
    Returns keys: min, max, currency, interval.
    """
    if not salary_str:
        return {"min": None, "max": None, "currency": None, "interval": None}
    match = SALARY_REGEX.search(salary_str.replace(',', ''))
    if not match:
        return {"min": None, "max": None, "currency": None, "interval": None}
    groups = match.groupdict()
    def _num(val: str) -> float:
        if not val:
            return None
        val = val.lower().replace('k', '000')
        try:
            return float(val)
        except ValueError:
            return None
    min_val = _num(groups.get('min'))
    max_val = _num(groups.get('max')) if groups.get('max') else min_val
    currency = groups.get('currency')
    interval = None
    if groups.get('interval'):
        interval = groups['interval'].split()[-1].lower()
    return {"min": min_val, "max": max_val, "currency": currency, "interval": interval}

# ---------------------------------------------------------------------------
# Date Parsing
# ---------------------------------------------------------------------------
RELATIVE_REGEX = re.compile(r"(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago", re.IGNORECASE)

def parse_posted_date(date_str: str) -> datetime:
    """Convert relative dates like "2 days ago" into a datetime.
    Falls back to None if parsing fails.
    """
    if not date_str:
        return None
    # Try absolute ISO format first
    try:
        return datetime.fromisoformat(date_str.rstrip('Z'))
    except Exception:
        pass
    # Relative format
    m = RELATIVE_REGEX.search(date_str)
    if not m:
        return None
    amount = int(m.group(1))
    unit = m.group(2).lower()
    delta = None
    if unit == 'second':
        delta = timedelta(seconds=amount)
    elif unit == 'minute':
        delta = timedelta(minutes=amount)
    elif unit == 'hour':
        delta = timedelta(hours=amount)
    elif unit == 'day':
        delta = timedelta(days=amount)
    elif unit == 'week':
        delta = timedelta(weeks=amount)
    elif unit == 'month':
        delta = timedelta(days=30 * amount)
    elif unit == 'year':
        delta = timedelta(days=365 * amount)
    if delta:
        return datetime.utcnow() - delta
    return None

# ---------------------------------------------------------------------------
# Tag & Skill Extraction
# ---------------------------------------------------------------------------
SENIORITY_KEYWORDS = {
    "junior": "junior",
    "entry": "junior",
    "mid": "mid",
    "senior": "senior",
    "sr": "senior",
    "lead": "lead",
    "principal": "lead",
    "staff": "lead"
}

TECH_KEYWORDS = ["python", "javascript", "react", "fastapi", "aws", "docker", "kubernetes", "sql", "mongodb", "typescript", "java", "c++", "go", "ruby"]

def extract_tags(job: Dict[str, Any]) -> List[str]:
    """Generate a list of tags based on title, description, remote flag, and employment type."""
    tags = []
    title = job.get('title', '').lower()
    description = job.get('description', '').lower()
    # Seniority
    for kw, tag in SENIORITY_KEYWORDS.items():
        if kw in title or kw in description:
            tags.append(tag)
            break
    # Tech keywords
    for tech in TECH_KEYWORDS:
        if tech in title or tech in description:
            tags.append(tech)
    # Remote flag
    if job.get('remote'):
        tags.append('remote')
    # Employment type
    emp = job.get('employment_type')
    if emp:
        tags.append(emp.lower())
    return tags

def extract_skills(description: str) -> List[str]:
    """Very naive skill extraction – split on common delimiters and dedupe."""
    if not description:
        return []
    # Split on commas, slashes, and newlines
    parts = re.split(r"[,/\n]+", description)
    skills = {p.strip().title() for p in parts if p.strip()}
    return list(skills)

# ---------------------------------------------------------------------------
# Fingerprint & Validation
# ---------------------------------------------------------------------------
def generate_fingerprint(title: str, company: str, source_id: str, location: str) -> str:
    """Create a deterministic hash used for deduplication.
    Uses SHA256 over the concatenated fields.
    """
    raw = f"{title}|{company}|{source_id}|{location}".encode('utf-8')
    return hashlib.sha256(raw).hexdigest()

def is_valid_job(job: Dict[str, Any]) -> Tuple[bool, str]:
    """Validate required fields according to the unified schema.
    Returns (is_valid, reason).
    """
    if not job.get('listing_url') and not job.get('apply_url'):
        return False, 'missing_url'
    # Ensure at least title exists
    if not job.get('title'):
        return False, 'missing_title'
    return True, ''

# ---------------------------------------------------------------------------
# End of file
# ---------------------------------------------------------------------------

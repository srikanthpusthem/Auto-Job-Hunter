"""
Resume parsing utilities for extracting text and structured data from resumes.
"""
import re
from typing import List, Dict, Any, Optional
import os

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file"""
    try:
        import PyPDF2
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except ImportError:
        # Fallback: try pdfplumber
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
            return text
        except ImportError:
            raise ImportError("Please install PyPDF2 or pdfplumber: pip install PyPDF2")
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file"""
    try:
        from docx import Document
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except ImportError:
        raise ImportError("Please install python-docx: pip install python-docx")
    except Exception as e:
        raise Exception(f"Error reading DOCX: {str(e)}")

def extract_text_from_file(file_path: str) -> str:
    """Extract text from resume file based on extension"""
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext in ['.doc', '.docx']:
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

def extract_skills(text: str, known_skills: List[str] = None) -> List[str]:
    """Extract skills from resume text"""
    if not known_skills:
        known_skills = [
            "Python", "JavaScript", "TypeScript", "Java", "C++", "Go", "Rust", "Ruby",
            "React", "Vue", "Angular", "Node.js", "Express", "FastAPI", "Django", "Flask",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD",
            "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
            "Git", "Linux", "Agile", "Scrum"
        ]
    
    text_lower = text.lower()
    found_skills = []
    
    for skill in known_skills:
        if skill.lower() in text_lower:
            found_skills.append(skill)
    
    return list(set(found_skills))  # Remove duplicates

def extract_experience_years(text: str) -> int:
    """Extract years of experience from resume text"""
    # Look for patterns like "5 years", "5+ years", "5 years of experience"
    patterns = [
        r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)',
        r'(?:experience|exp)[:\s]+(\d+)\+?\s*years?',
        r'(\d+)\+?\s*years?\s*(?:in|of)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            try:
                years = max([int(m) for m in matches])
                return years
            except:
                pass
    
    # Fallback: count years mentioned in work experience
    year_pattern = r'(\d{4})\s*[-–]\s*(\d{4}|present|current)'
    matches = re.findall(year_pattern, text, re.IGNORECASE)
    if matches:
        return len(matches)  # Rough estimate
    
    return 0

def extract_keywords(text: str) -> List[str]:
    """Extract keywords from resume text"""
    # Common job-related keywords
    keyword_patterns = [
        r'\b(?:senior|lead|principal|staff|architect|engineer|developer|manager|director)\b',
        r'\b(?:remote|onsite|hybrid|full.?time|part.?time|contract|freelance)\b',
        r'\b(?:startup|enterprise|SaaS|B2B|B2C)\b',
        r'\b(?:agile|scrum|kanban|devops|microservices|api|rest|graphql)\b',
    ]
    
    keywords = []
    text_lower = text.lower()
    
    for pattern in keyword_patterns:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        keywords.extend(matches)
    
    # Also extract capitalized terms (likely technologies/companies)
    capitalized_terms = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
    keywords.extend([term for term in capitalized_terms if len(term) > 3])
    
    return list(set(keywords[:20]))  # Limit to 20 unique keywords

def extract_summary(text: str) -> str:
    """Extract or generate professional summary from resume text"""
    # Look for common summary section headers
    summary_patterns = [
        r'(?:summary|profile|about|objective|overview)[:\s]+(.*?)(?:\n\n|\n[A-Z][a-z]+\s*:|$)',
        r'(?:professional\s+summary|executive\s+summary)[:\s]+(.*?)(?:\n\n|\n[A-Z][a-z]+\s*:|$)',
    ]
    
    text_lines = text.split('\n')
    
    # Try to find summary section
    for pattern in summary_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            summary = match.group(1).strip()
            # Clean up the summary
            summary = re.sub(r'\s+', ' ', summary)  # Normalize whitespace
            if len(summary) > 50:  # Only use if substantial
                return summary[:500]  # Limit to 500 chars
    
    # If no explicit summary section, extract from first paragraph
    # Look for the first substantial paragraph (usually after name/contact)
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    
    for para in paragraphs[:3]:  # Check first 3 paragraphs
        # Skip contact info, education headers, etc.
        if len(para) > 100 and not re.match(r'^(email|phone|address|education|experience|skills)', para, re.IGNORECASE):
            # Check if it looks like a summary (not a list, has sentences)
            if '.' in para and len(para.split()) > 15:
                cleaned = re.sub(r'\s+', ' ', para)
                return cleaned[:500]  # Limit to 500 chars
    
    # Fallback: Generate a simple summary from key info
    # Extract years of experience
    exp_years = extract_experience_years(text)
    
    # Extract top skills
    top_skills = extract_skills(text)[:5]
    
    if top_skills:
        skills_str = ', '.join(top_skills)
        if exp_years > 0:
            return f"Experienced professional with {exp_years} years of experience in {skills_str}. Seeking opportunities to leverage expertise and drive impactful results."
        else:
            return f"Skilled professional with expertise in {skills_str}. Passionate about continuous learning and delivering high-quality solutions."
    
    return ""  # Return empty if nothing can be extracted

def parse_resume(file_path: str) -> Dict[str, Any]:
    """Parse resume file and extract structured data"""
    try:
        # Extract text
        text = extract_text_from_file(file_path)
        
        # Extract structured data
        skills = extract_skills(text)
        experience_years = extract_experience_years(text)
        keywords = extract_keywords(text)
        summary = extract_summary(text)
        
        return {
            "resume_text": text,
            "skills": skills,
            "experience_years": experience_years,
            "keywords": keywords,
            "summary": summary,
            "parsed_successfully": True
        }
    except Exception as e:
        return {
            "resume_text": "",
            "skills": [],
            "experience_years": 0,
            "keywords": [],
            "summary": "",
            "parsed_successfully": False,
            "error": str(e)
        }


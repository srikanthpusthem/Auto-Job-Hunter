# Dashboard & Profile Enhancement Plan

## Goals

1. **Add "Search Jobs" to Dashboard** - Replace "Start Job Hunt" with intuitive job search on dashboard
2. **Enhanced Profile Page** - More detailed profile with additional fields
3. **Resume Upload** - Functional resume upload and parsing
4. **Keywords for Search & Matching** - Use keywords from profile for job search and matching

## Implementation Plan

### Phase 1: Add Search Jobs to Dashboard

#### 1.1 Dashboard Search Component
**File**: `frontend/src/pages/Dashboard.jsx`

**Features**:
- Prominent search bar at top of dashboard
- Quick search with keywords input
- Source selection (Google Jobs, YC, LinkedIn, etc.)
- Location filter
- Remote toggle
- "Search Jobs" button that triggers scan
- Show search status (searching, results found)
- Link to Jobs page after search

**UI Design**:
- Search bar with icon
- Dropdown for sources (multi-select)
- Location input with autocomplete suggestions
- Toggle for remote only
- Large, prominent "Search Jobs" button
- Status indicator below search

#### 1.2 Update API
**File**: `frontend/src/lib/api.js`
- Keep existing `triggerScan` but enhance with keywords parameter

### Phase 2: Enhanced Profile Page

#### 2.1 Additional Profile Fields
**Backend Model**: `backend/db/models.py` - `UserProfile`

**New Fields to Add**:
- `keywords`: List[str] - Search keywords for job matching
- `resume_file_url`: Optional[str] - URL/path to uploaded resume
- `resume_parsed_text`: Optional[str] - Extracted text from resume
- `education`: List[Dict] - Education history
- `work_experience`: List[Dict] - Work experience
- `summary`: Optional[str] - Professional summary/bio
- `desired_salary_min`: Optional[float]
- `desired_salary_max`: Optional[float]
- `desired_currency`: Optional[str]
- `job_types`: List[str] - Preferred job types (Engineering, Design, etc.)
- `employment_types`: List[str] - Preferred employment types (full-time, contract, etc.)

#### 2.2 Profile Page UI Enhancements
**File**: `frontend/src/pages/ProfilePage.jsx`

**Sections**:
1. **Basic Information** (Name, Email - read-only)
2. **Professional Summary** (Textarea for bio)
3. **Skills** (Comma-separated or tag input)
4. **Keywords for Job Search** (NEW - Comma-separated keywords)
5. **Experience** (Years + Work history)
6. **Education** (Optional - Degree, Institution, Year)
7. **Resume Upload** (Functional upload with preview)
8. **Job Preferences**:
   - Location
   - Remote preference
   - Job types (multi-select)
   - Employment types (multi-select)
   - Salary range (min/max)
9. **LinkedIn URL** (Optional)
10. **Save Button**

### Phase 3: Resume Upload Implementation

#### 3.1 Backend Resume Upload Endpoint
**File**: `backend/app/routes/users.py` (add new endpoint)

**Endpoint**: `POST /api/users/resume`

**Functionality**:
- Accept PDF, DOC, DOCX files
- Validate file size (max 5MB)
- Store file (local storage or cloud storage)
- Extract text from resume using library (PyPDF2, python-docx)
- Parse resume to extract:
  - Skills
  - Experience years
  - Education
  - Work history
  - Keywords
- Update user profile with extracted data
- Return parsed data

**Dependencies**:
- `PyPDF2` or `pdfplumber` for PDF parsing
- `python-docx` for DOCX parsing
- File storage handling

#### 3.2 Frontend Resume Upload
**File**: `frontend/src/pages/ProfilePage.jsx`

**Features**:
- Drag & drop upload area
- File selection button
- Show selected file name
- Upload progress indicator
- Display parsed resume data (preview)
- Allow user to confirm/update parsed data
- Show extracted skills, experience, etc.

#### 3.3 Resume Parsing Service
**File**: `backend/utils/resume_parser.py` (new file)

**Functions**:
- `parse_pdf(file_path) -> str` - Extract text from PDF
- `parse_docx(file_path) -> str` - Extract text from DOCX
- `extract_skills(text) -> List[str]` - Extract skills from text
- `extract_experience(text) -> int` - Extract years of experience
- `extract_education(text) -> List[Dict]` - Extract education
- `extract_keywords(text) -> List[str]` - Extract keywords

### Phase 4: Keywords for Search & Matching

#### 4.1 Update Profile Model
**Backend**: `backend/db/models.py`

Add `keywords` field to `UserProfile`:
```python
keywords: List[str] = []  # Search keywords for job matching
```

#### 4.2 Update Search Query
**File**: `backend/app/routes/jobs.py` - `ScanRequest`

**Add**:
```python
keywords: Optional[List[str]] = None  # Keywords from profile
```

#### 4.3 Use Keywords in Scout Agent
**File**: `backend/agents/scout.py`

**Update**:
- Extract keywords from user profile
- Use keywords in search query if provided
- Combine with skills for better search

#### 4.4 Use Keywords in Matcher
**File**: `backend/agents/matcher.py`

**Update**:
- Include keywords in matching logic
- Weight keywords in match score calculation
- Show keyword matches in match_reasoning

#### 4.5 Profile Keywords Input
**File**: `frontend/src/pages/ProfilePage.jsx`

**Add**:
- Dedicated keywords input field
- Help text: "Keywords help us find better job matches (e.g., 'Python developer', 'remote work', 'startup')"
- Auto-suggest based on skills
- Tag-style input (optional enhancement)

## Implementation Order

1. ✅ **Update Profile Model** - Add keywords and new fields
2. ✅ **Backend Resume Upload Endpoint** - Create upload and parsing
3. ✅ **Frontend Resume Upload** - Make upload functional
4. ✅ **Enhanced Profile Page** - Add all new fields and sections
5. ✅ **Dashboard Search Component** - Add search to dashboard
6. ✅ **Keywords Integration** - Use keywords in search and matching
7. ✅ **Testing** - Test end-to-end flow

## Technical Details

### Resume Parsing Libraries
- **PDF**: `PyPDF2` or `pdfplumber` (better for complex PDFs)
- **DOCX**: `python-docx`
- **Text Extraction**: Use LLM to extract structured data from resume text

### File Storage
- Option 1: Local file system (`backend/uploads/resumes/`)
- Option 2: Cloud storage (S3, etc.)
- Store file path/URL in database

### Keywords Usage
- Keywords from profile → used in search query
- Keywords matched in job description → higher match score
- Display keyword matches in job cards

## Success Criteria

- [ ] Dashboard has prominent "Search Jobs" section
- [ ] Profile page has all new fields
- [ ] Resume upload works and extracts data
- [ ] Keywords are used in job search
- [ ] Keywords improve match scores
- [ ] UI is intuitive and user-friendly
- [ ] All data saves correctly


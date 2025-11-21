# Testing Guide - Enhanced Features

## ✅ What's Been Implemented

### 1. Enhanced Profile Page
- ✅ Professional summary field
- ✅ Keywords for job search (separate from skills)
- ✅ Resume upload with drag & drop
- ✅ Job types selection (multi-select buttons)
- ✅ Employment types selection (multi-select)
- ✅ Salary range (min/max with currency)
- ✅ LinkedIn URL field
- ✅ Auto-population from resume parsing

### 2. Dashboard Search Component
- ✅ "Search Jobs" section at top of dashboard
- ✅ Keywords input (pre-filled from profile)
- ✅ Location input
- ✅ Remote only toggle
- ✅ Source selection (Google Jobs, YC, LinkedIn, Indeed, Wellfound)
- ✅ "Search Jobs" button
- ✅ Auto-navigation to Jobs page

### 3. Resume Upload & Parsing
- ✅ Backend endpoint: `POST /api/users/resume`
- ✅ Supports PDF, DOC, DOCX (max 5MB)
- ✅ Extracts: skills, experience, keywords
- ✅ Auto-populates profile fields

### 4. Keywords Integration
- ✅ Keywords used in job search queries
- ✅ Keywords weighted in matching algorithm
- ✅ Keywords from profile auto-populate search

## 🧪 How to Test

### Test 1: Enhanced Profile Page

1. **Navigate to Profile Page**
   - Go to `http://localhost:5173/profile`
   - You should see all new fields

2. **Fill in Profile**
   - Add professional summary
   - Add skills (comma-separated)
   - Add keywords (e.g., "Python developer", "remote work", "startup")
   - Select job types (Engineering, Design, etc.)
   - Select employment types (Full-time, Contract, etc.)
   - Set salary range
   - Add LinkedIn URL

3. **Test Resume Upload**
   - Click on resume upload area
   - Select a PDF/DOC/DOCX file (or drag & drop)
   - Wait for upload and parsing
   - Verify extracted data appears:
     - Skills extracted
     - Keywords extracted
     - Experience years extracted
   - Verify form fields are auto-populated

4. **Save Profile**
   - Click "Save Profile"
   - Verify success message
   - Refresh page and verify data persists

### Test 2: Dashboard Search

1. **Navigate to Dashboard**
   - Go to `http://localhost:5173/dashboard`
   - You should see "Search Jobs" section at the top

2. **Verify Pre-filled Data**
   - Keywords should be pre-filled from profile
   - Location should be pre-filled from profile
   - Remote only should match profile preference

3. **Modify Search Query**
   - Change keywords (e.g., "React developer remote")
   - Change location (e.g., "San Francisco, CA")
   - Toggle remote only
   - Select/deselect job sources

4. **Start Search**
   - Click "Search Jobs" button
   - Verify loading state
   - Verify success message
   - Should auto-navigate to Jobs page after 2 seconds

### Test 3: Keywords in Job Matching

1. **Set Keywords in Profile**
   - Go to Profile page
   - Add specific keywords like "Python developer", "remote work"
   - Save profile

2. **Search for Jobs**
   - Go to Dashboard
   - Use "Search Jobs" with your keywords
   - Start search

3. **Check Job Matches**
   - Go to Jobs page
   - Verify jobs match your keywords
   - Check match scores and reasoning
   - Verify keyword matches are mentioned in match_reasoning

### Test 4: Resume Parsing

1. **Prepare Test Resume**
   - Create a simple PDF/DOCX with:
     - Skills: Python, React, FastAPI
     - Experience: "5 years of experience"
     - Keywords: "Python developer", "remote work"

2. **Upload Resume**
   - Go to Profile page
   - Upload the resume
   - Wait for parsing

3. **Verify Extraction**
   - Check that skills are extracted
   - Check that keywords are extracted
   - Check that experience years are extracted
   - Verify form fields are updated

## 🔍 API Endpoints to Test

### Resume Upload
```bash
curl -X POST "http://localhost:8000/api/users/resume?clerk_user_id=test123" \
  -F "file=@/path/to/resume.pdf"
```

### Dashboard Stats
```bash
curl "http://localhost:8000/api/dashboard/stats?clerk_user_id=test123"
```

### Job Search with Keywords
```bash
curl -X POST "http://localhost:8000/api/jobs/scan" \
  -H "Content-Type: application/json" \
  -d '{
    "clerk_user_id": "test123",
    "sources": ["google_jobs", "yc"],
    "keywords": ["Python developer", "remote work"],
    "location": "Remote",
    "match_threshold": 0.6
  }'
```

## 🐛 Common Issues & Solutions

### Issue: Resume upload fails
- **Check**: File size < 5MB
- **Check**: File type is PDF, DOC, or DOCX
- **Check**: Backend has write permissions to `backend/uploads/resumes/`

### Issue: Keywords not working in search
- **Check**: Keywords are saved in profile
- **Check**: Keywords are included in search request
- **Check**: Scout agent receives keywords in search_query

### Issue: Dashboard search doesn't navigate
- **Check**: React Router is configured correctly
- **Check**: Navigation happens after 2 seconds
- **Check**: Jobs page route exists

## ✅ Success Criteria

- [ ] Profile page shows all new fields
- [ ] Resume upload works and extracts data
- [ ] Dashboard shows "Search Jobs" section
- [ ] Search pre-fills with profile data
- [ ] Job search uses keywords
- [ ] Keywords improve match scores
- [ ] All data persists after save

## 📝 Notes

- Resume files are stored in `backend/uploads/resumes/`
- Keywords are merged with skills if not provided separately
- Search automatically includes profile keywords
- Match scores should be higher when keywords match job descriptions


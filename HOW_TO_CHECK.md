# How to Check if Auto-Job-Hunter is Working

## Quick Status Check

### 1. Check if Servers are Running

```bash
# Check backend (port 8000)
curl http://localhost:8000/health

# Check frontend (port 5173)
curl http://localhost:5173
```

### 2. Access the Application

**Frontend (Web UI):**
- Open your browser and go to: `http://localhost:5173`
- You should see the Auto-Job-Hunter landing page

**Backend API Docs:**
- Open: `http://localhost:8000/docs`
- This shows the interactive API documentation (Swagger UI)

### 3. Test API Endpoints

#### Check if jobs exist:
```bash
curl "http://localhost:8000/api/jobs?clerk_user_id=test&limit=5"
```

#### Check health:
```bash
curl http://localhost:8000/health
```

#### List all available endpoints:
```bash
curl http://localhost:8000/openapi.json | python3 -m json.tool | grep -A 1 '"paths"'
```

### 4. Manual Testing Steps

1. **Open Frontend:**
   - Go to `http://localhost:5173` in your browser
   - You should see the landing page

2. **Sign In (if using Clerk):**
   - Click "Sign In" 
   - Complete authentication

3. **Create/Update Profile:**
   - Navigate to Profile page
   - Fill in your skills, experience, location preferences
   - Click "Save Profile"

4. **Trigger Job Scan:**
   - On Profile page, click "Start Job Hunt"
   - Wait for scan to complete (check backend logs)

5. **View Matched Jobs:**
   - Navigate to Jobs page
   - You should see matched jobs with:
     - Company name (not `company_name`)
     - Apply/View Listing buttons (using `apply_url`/`listing_url`)
     - Salary information (nested `salary` object)
     - Match scores

6. **Generate Outreach:**
   - Click "Generate Outreach" on any job
   - Should show email subject, body, and LinkedIn DM

### 5. Check Backend Logs

```bash
# View backend logs
tail -f /tmp/backend.log

# Or if running in terminal, check the console output
```

### 6. Verify Database Connection

The backend automatically connects to MongoDB on startup. Check logs for:
- `Connected to MongoDB at ...`
- No connection errors

### 7. Common Issues to Check

**Backend not responding:**
```bash
# Check if process is running
lsof -ti:8000

# Restart backend:
cd /path/to/Auto-Job-Hunter
python3 -m uvicorn backend.app.main:app --reload --port 8000
```

**Frontend not loading:**
```bash
# Check if process is running
lsof -ti:5173

# Restart frontend:
cd frontend
npm run dev
```

**API returns old schema:**
- Existing jobs in DB may have old format
- New jobs will use correct nested schema
- Check new jobs created after our fixes

### 8. Quick Verification Script

Run this to check everything at once:

```bash
#!/bin/bash
echo "=== Checking Backend ==="
curl -s http://localhost:8000/health && echo " ✓ Backend healthy" || echo " ✗ Backend down"

echo -e "\n=== Checking Frontend ==="
curl -s http://localhost:5173 > /dev/null && echo " ✓ Frontend accessible" || echo " ✗ Frontend down"

echo -e "\n=== Checking API Routes ==="
curl -s http://localhost:8000/openapi.json | python3 -c "import sys, json; paths = sorted(json.load(sys.stdin).get('paths', {}).keys()); print(f'Found {len(paths)} endpoints')" && echo " ✓ API routes loaded" || echo " ✗ API routes error"

echo -e "\n=== Testing Jobs Endpoint ==="
curl -s "http://localhost:8000/api/jobs?clerk_user_id=test&limit=1" | python3 -m json.tool > /dev/null && echo " ✓ Jobs endpoint working" || echo " ✗ Jobs endpoint error"
```

## Expected Results

✅ **Backend Health:** `{"status":"healthy"}`  
✅ **Frontend:** HTML page loads  
✅ **API Docs:** Swagger UI accessible at `/docs`  
✅ **Jobs Endpoint:** Returns JSON with job data  
✅ **Schema:** New jobs use nested `outreach.email_subject` format  

## What to Look For

1. **Correct Schema Fields:**
   - `job.company` (not `company_name`)
   - `job.listing_url` or `job.apply_url` (not `url`)
   - `job.outreach.email_subject` (not `outreach_email_subject`)
   - `job.salary.min`, `job.salary.max` (nested object)

2. **No Errors:**
   - Check browser console (F12) for frontend errors
   - Check backend logs for API errors
   - Check network tab for failed requests

3. **Functionality:**
   - Profile saves successfully
   - Job scan completes
   - Jobs display correctly
   - Outreach generation works


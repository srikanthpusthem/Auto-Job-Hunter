# Dashboard Enhancement Plan

## Current State Analysis

### What We Have Now
- **Hardcoded Statistics**: Dashboard shows static values (1,234, 87, 23, 12)
- **Mock Activity**: Recent activity section has fake data
- **No Backend Integration**: Dashboard doesn't fetch real data
- **No Loading States**: No indication when data is being fetched
- **No Error Handling**: No way to handle API failures

### Available Data Sources
1. **Jobs Collection** (`matched_jobs`):
   - Job statuses: NEW, MATCHED, APPLIED, REJECTED, INTERVIEW, OFFER
   - Match scores (0.0 - 1.0)
   - Created timestamps
   - Job sources (google_jobs, yc, linkedin, indeed, wellfound)
   - Company, location, remote flags

2. **Scan Runs Collection** (`scan_runs`):
   - Scan status (pending, running, completed, failed)
   - Jobs found count
   - Jobs matched count
   - Started/completed timestamps
   - Sources used

3. **User Profile**:
   - Skills, experience, preferences

## Goals

1. **Real-Time Statistics**: Display actual counts from database
2. **Dynamic Activity Feed**: Show real scan runs and job matches
3. **Better UX**: Loading states, error handling, empty states
4. **Visual Improvements**: Better formatting, icons, relative dates
5. **Performance**: Efficient queries, caching where appropriate

## Implementation Plan

### Phase 1: Backend API Endpoint

#### 1.1 Create Dashboard Stats Endpoint
**File**: `backend/app/routes/dashboard.py` (new file)

**Endpoint**: `GET /api/dashboard/stats?clerk_user_id={id}`

**Returns**:
```json
{
  "stats": {
    "total_jobs_scanned": 1234,
    "matched_jobs": 87,
    "applications_sent": 23,
    "pending_reviews": 12,
    "average_match_score": 0.78,
    "high_match_jobs": 45  // jobs with score >= 0.8
  },
  "recent_activity": [
    {
      "type": "scan_completed",
      "message": "Job scan completed",
      "details": "Found 15 jobs, matched 8",
      "timestamp": "2025-01-20T10:30:00Z",
      "relative_time": "2h ago"
    },
    {
      "type": "job_matched",
      "message": "New job match found",
      "details": "Senior Python Developer at Tech Corp (90% match)",
      "timestamp": "2025-01-20T09:15:00Z",
      "relative_time": "3h ago"
    }
  ],
  "top_sources": [
    { "source": "google_jobs", "count": 45 },
    { "source": "yc", "count": 23 },
    { "source": "linkedin", "count": 19 }
  ],
  "status_breakdown": {
    "new": 12,
    "matched": 45,
    "applied": 23,
    "rejected": 5,
    "interview": 2,
    "offer": 1
  }
}
```

#### 1.2 Add Repository Methods
**File**: `backend/db/repositories.py`

**Add to JobRepository**:
```python
async def count_by_status(self, status: str) -> int:
    """Count jobs by status"""
    
async def get_recent_jobs(self, limit: int = 10) -> List[Dict]:
    """Get most recently matched jobs"""
    
async def get_match_score_stats(self) -> Dict:
    """Get average match score and distribution"""
    
async def count_by_source(self) -> List[Dict]:
    """Count jobs grouped by source"""
```

**Add to RunRepository**:
```python
async def get_recent_runs(self, limit: int = 10) -> List[Dict]:
    """Get most recent scan runs"""
    
async def get_total_scanned(self) -> int:
    """Get total number of jobs scanned across all runs"""
```

### Phase 2: Frontend Updates

#### 2.1 Update API Client
**File**: `frontend/src/lib/api.js`

**Add**:
```javascript
export const dashboardApi = {
  getStats: async (clerkUserId) => {
    const response = await api.get('/api/dashboard/stats', {
      params: { clerk_user_id: clerkUserId }
    })
    return response.data
  }
}
```

#### 2.2 Create Dashboard Store (Optional)
**File**: `frontend/src/store/dashboardStore.js` (new file)

Or extend existing `jobStore.js` to include dashboard stats.

#### 2.3 Update Dashboard Component
**File**: `frontend/src/pages/Dashboard.jsx`

**Changes**:
1. Add `useState` for stats, loading, error
2. Add `useEffect` to fetch data on mount
3. Replace hardcoded stats with real data
4. Add loading skeleton/spinner
5. Add error state
6. Format numbers (1,234 format)
7. Format dates (relative: "2h ago")
8. Display recent activity from API
9. Show empty states when no data

**New Features**:
- Refresh button
- Auto-refresh every 60 seconds (optional)
- Match score visualization (progress bar or chart)
- Top sources visualization
- Status breakdown chart

### Phase 3: UI/UX Improvements

1. **Loading States**:
   - Skeleton loaders for stat cards
   - Spinner for initial load

2. **Error Handling**:
   - Error message display
   - Retry button
   - Fallback to cached data if available

3. **Empty States**:
   - "No jobs yet" message
   - "Start your first scan" CTA
   - Helpful tips

4. **Visual Enhancements**:
   - Better icons (from lucide-react)
   - Color coding by status
   - Progress indicators
   - Hover effects
   - Smooth transitions

5. **Date Formatting**:
   - Relative time: "2h ago", "3 days ago"
   - Absolute time on hover
   - Timezone handling

## Statistics to Calculate

### Core Stats
1. **Total Jobs Scanned**: Sum of `jobs_found` from all completed scan runs
2. **Matched Jobs**: Count of jobs with `status = "matched"`
3. **Applications Sent**: Count of jobs with `status = "applied"`
4. **Pending Reviews**: Count of jobs with `status IN ["new", "matched"]`

### Additional Stats
5. **Average Match Score**: Average of all matched jobs' `match_score`
6. **High Match Jobs**: Count of jobs with `match_score >= 0.8`
7. **Top Sources**: Group by `source` field, count, sort descending
8. **Status Breakdown**: Count by each status type
9. **Recent Matches**: Last 5-10 jobs matched (by `created_at`)

## Activity Feed Items

1. **Scan Completed**:
   - "Job scan completed"
   - "Found X jobs, matched Y"
   - Timestamp from scan run

2. **Job Matched**:
   - "New job match found"
   - Job title, company, match score
   - Timestamp from job `created_at`

3. **Application Sent**:
   - "Application sent"
   - Job title, company
   - Timestamp when status changed to APPLIED

4. **Profile Updated**:
   - "Profile updated"
   - What changed (skills, preferences)
   - Timestamp from user update

## Technical Considerations

### Performance
- Use MongoDB aggregation pipelines for efficient counting
- Cache statistics for 30-60 seconds
- Limit recent activity queries (last 10 items)
- Index on frequently queried fields (status, created_at, source)

### Error Handling
- Handle missing data gracefully
- Show default values (0) when no data
- Log errors for debugging
- Provide user-friendly error messages

### Data Consistency
- Handle race conditions (multiple scans running)
- Ensure counts are accurate
- Handle deleted jobs gracefully

## Implementation Order

1. ✅ **Backend Repository Methods** - Add query methods first
2. ✅ **Backend API Endpoint** - Create stats endpoint
3. ✅ **Frontend API Client** - Add dashboard API function
4. ✅ **Dashboard Component** - Update to fetch and display real data
5. ✅ **UI Improvements** - Add loading, error, empty states
6. ✅ **Testing** - Verify with real data

## Success Criteria

- [ ] Dashboard shows real statistics from database
- [ ] Recent activity shows actual scan runs and job matches
- [ ] Loading states work properly
- [ ] Error handling works
- [ ] Numbers are formatted correctly (1,234)
- [ ] Dates show relative time ("2h ago")
- [ ] Empty states display when no data
- [ ] Performance is acceptable (< 500ms load time)
- [ ] Mobile responsive

## Future Enhancements (Out of Scope)

- Charts/graphs for trends over time
- Export statistics
- Comparison with previous period
- Notifications for new matches
- Quick actions (apply, save, dismiss)


## 🎯 PostJob Feature — Quick Reference

### 📌 What Was Built
A complete **job posting workflow** for clients with minimal typing through click-based UI.

---

### 📂 Key Files

| File | Size | Purpose |
|------|------|---------|
| `frontend/app/Client/PostJob.tsx` | 42 KB | Complete job posting form (4 steps, responsive) |
| `backend/jobs/jobs.js` | Updated | New `POST /jobs` endpoint to create jobs |
| `frontend/app/Client/DashboardClient.tsx` | Updated | Added navigation button to PostJob |

---

### 🎨 UI Overview

```
Step 1: Basics           Step 2: Planning         Step 3: Budget          Step 4: Summary
┌─────────────────┐    ┌─────────────────┐      ┌─────────────────┐     ┌──────────────┐
│ • Categorie     │    │ • Date & time   │      │ • Budget type   │     │ Job Preview  │
│ • Titel (auto)  │    │ • Job type      │      │ • Presets       │     │ All details  │
│ • Zone/Adres    │    │ • Validation    │      │ • Description   │     │ Review & GO! │
└─────────────────┘    └─────────────────┘      └─────────────────┘     └──────────────┘
                           Next →                   Next →              Place Job ✓
```

---

### ⚡ Key Features

✅ **Click-based (minimize typing)**
- Dropdown categories
- Auto-fill title suggestions
- Duration presets (2u, 3u, 4u, 5u)
- Price presets (€25-€150)
- Description templates (4 quick chips)

✅ **Smart Defaults**
- Job type: Hourly (default)
- End time: Auto +2 hours
- Urgent: OFF by default

✅ **Live Preview**
- Desktop: Sticky preview panel on right
- Mobile: Preview below form
- Updates in real-time

✅ **Responsive Design**
- Desktop: 2 columns (form + preview)
- Mobile: 1 column (form → preview)
- Dark/light mode support

✅ **Validation**
- Step-by-step requirements
- Buttons disabled until valid
- Inline error messages (no alerts)

---

### 🔌 API Endpoints

#### Create Job
```bash
POST /jobs
Content-Type: application/json

# Required fields:
{
  "client_id": "user-id",
  "category_id": 1,
  "title": "Job title",
  "start_time": "2025-12-20T14:00:00Z",
  "hourly_or_fixed": "fixed",
  "fixed_price": 50
}

# Optional fields:
{
  "description": "Job details",
  "area_text": "Location",
  "end_time": "2025-12-20T16:00:00Z",
  "hourly_rate": null
}
```

**Response (201):**
```json
{
  "message": "Job created successfully",
  "job": { id, client_id, category_id, title, ... }
}
```

---

### 💬 User Flow

```
Client Dashboard
       ↓
   [Create Job] button
       ↓
PostJob Page (Step 1)
  Select Categorie → 
  Pick or Edit Title → 
  Enter Location
       ↓
  [Next →] button
       ↓
Step 2: Planning
  Pick Date/Time → 
  Choose Hourly/Fixed
       ↓
  [Next →] button
       ↓
Step 3: Budget & Details
  Click Budget Preset → 
  Add Description (optional)
       ↓
  [Next →] button
       ↓
Step 4: Review
  Check all details → 
  [✓ Job plaatsen]
       ↓
Success Alert
       ↓
Dashboard (my jobs)
```

---

### 🎛️ Form State

```typescript
const [formData, setFormData] = useState({
  client_id: "...",              // From localStorage
  category_id: null,             // 1-5 (Categorie dropdown)
  title: "",                     // Title input, max 80 chars
  description: "",               // Textarea, max 500 chars
  area_text: "",                 // Location input
  hourly_or_fixed: "hourly",     // Segmented: hourly | fixed
  hourly_rate: null,             // Not used (internal pricing)
  fixed_price: null,             // Fixed price amount
  start_time: new Date(),        // Date + time picker
  end_time: null,                // Auto-calc if null
  duration: null,                // Hourly: 2|3|4|5 hours
  urgent: false                  // Toggle: +10% (UI only)
});
```

---

### ✅ Validation Rules

| Step | Field | Valid? |
|------|-------|--------|
| 1 | category_id | Required (not null) |
| 1 | title | Required (not empty) |
| 2 | start_time | Required (future date) |
| 2 | end_time or duration | At least one required |
| 3 | fixed_price (if fixed) | Required for fixed jobs |
| 3 | duration (if hourly) | Required for hourly jobs |

→ **Next/Submit buttons disabled until all requirements met**

---

### 🎯 Categories

| ID | NL | FR | EN |
|----|----|----|-----|
| 1 | Schoonmaak | Nettoyage | Cleaning |
| 2 | Tuinwerk | Jardinage | Gardening |
| 3 | Reparatie | Réparation | Repair |
| 4 | Verhuizing | Déménagement | Moving |
| 5 | Klusjeswerk | Bricolage | Handyman |

---

### 📱 Responsive Breakpoints

| Screen Size | Layout | Preview |
|-------------|--------|---------|
| **Desktop** (>768px) | 2 columns | Sticky right panel |
| **Mobile** (≤768px) | 1 column | Below form |

---

### 🛠️ Testing

#### Manual Test: Create a Job
```bash
# 1. Open: http://localhost:3000 (web) or Expo (mobile)
# 2. Login as Client
# 3. Dashboard → [Create Job]
# 4. Fill all 4 steps
# 5. Click [✓ Job plaatsen]
# 6. See: "Job geplaatst" alert
# 7. Redirects to Dashboard
```

#### API Test: POST /jobs
```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test-client",
    "category_id": 1,
    "title": "Huis schoonmaak",
    "area_text": "Brussel",
    "hourly_or_fixed": "fixed",
    "fixed_price": 50,
    "start_time": "2025-12-20T14:00:00Z"
  }'

# Expected: 201 with job object
```

---

### 🎨 Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Primary Button | Green | #176B51 |
| Background | Light Gray | #F5F7FA |
| Card Background | White | #fff |
| Text (Primary) | Dark Navy | #1a2e4c |
| Text (Secondary) | Gray | #64748B |
| Urgent Badge | Red | #DC2626 |
| Success | Green | #10B981 |
| Warning | Orange | #F59E0B |

---

### 📊 Step-by-Step Summary

| Step | Title | Required | Optional |
|------|-------|----------|----------|
| 1 | Basis Informatie | Category, Title | Area/Zone |
| 2 | Planning | Date, Time, Job Type | End Time |
| 3 | Budget & Details | Budget | Description, Urgent |
| 4 | Overzicht | — | Save draft, Cancel |

---

### 🚀 Getting Started

1. **Backend running?**
   ```bash
   cd backend && node server.js
   # Should say: 🚀 Server running on http://localhost:3000
   ```

2. **Frontend running?**
   ```bash
   cd frontend && npm start
   # Opens Expo or http://localhost:3000 on web
   ```

3. **Create a job:**
   - Dashboard → Create Job → Fill 4 steps → Place Job ✓

---

### 🔗 Related Files

- **Backend Job Endpoint:** `backend/jobs/jobs.js`
- **Frontend Routes:** `frontend/app/(tabs)/_layout.tsx`
- **Styling Constants:** `frontend/constants/Colors.ts`
- **Navigation:** `frontend/app/Client/DashboardClient.tsx`
- **Components Used:** Icons from `lucide-react-native`

---

### 📝 Notes

- **Client ID:** Read from `localStorage.studentId` — update after final auth flow
- **Categories:** Must exist in DB table `job_categories` (id: 1-5)
- **Urgent Flag:** UI toggle only (doesn't change pricing yet)
- **Draft Saving:** UI shows alert but doesn't persist to DB
- **End Time:** Auto-calculates +2h if not provided

---

**Last Updated:** 16 December 2025  
**Status:** ✅ Ready for QA Testing

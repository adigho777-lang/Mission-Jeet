# 🔌 API System — Complete Guide

## Overview

Mission JEET ka API system fully dynamic hai. Matlab **bina code change kiye** kabhi bhi API change kar sakte ho sirf Admin Panel se.

---

## Data Flow (Kaise kaam karta hai)

```
External API Server
       ↓
  Admin Panel me Base URL set karo
       ↓
  "Sync Batches → Firebase" click karo
       ↓
  Data Firebase me store ho jaata hai
       ↓
  Website sirf Firebase se data dikhati hai
```

**Website kabhi directly API se data nahi leta** — sirf Firebase se.

---

## Step-by-Step Usage

### Step 1: Base URL Set Karo

Admin Panel → 🔌 API Management tab kholo.

**Base URL field me daalo:**
```
https://yourserver.com/api/missionjeet
```

Example:
```
https://apiserverpro.onrender.com/api/missionjeet
```

> ⚠️ Sirf Base URL dalna hai — baaki sab automatically handle hota hai.

---

### Step 2: Test Karo

**"Test" button** click karo.

- ✅ `Connected — 2 batches found` → API working hai
- ❌ `Failed` → Server down hai ya URL galat hai

> Test button automatically URL save bhi karta hai Firestore me.

---

### Step 3: Sync Karo

**"🔄 Sync Batches → Firebase"** button click karo.

Ye kya karta hai:
1. Configured Base URL se `/batches` endpoint call karta hai
2. Saare courses/batches fetch karta hai
3. Firebase `batches` collection me save karta hai
4. Website automatically updated data dikhane lagti hai

---

## Endpoints (Auto-appended)

System automatically Base URL ke saath ye endpoints use karta hai:

| Endpoint | Kab use hota hai |
|----------|-----------------|
| `/batches` | Course list fetch karne ke liye |
| `/course-details?courseid={id}` | Course ka title, price, thumbnail |
| `/all-content/{courseId}` | Course ke saare videos aur folders |
| `/all-content/{courseId}?id={folderId}` | Kisi folder ke andar ka content |
| `/content-details?content_id=&course_id=` | Video ka actual play URL |

**Example:**
```
Base URL: https://apiserverpro.onrender.com/api/missionjeet

System banata hai:
→ https://apiserverpro.onrender.com/api/missionjeet/batches
→ https://apiserverpro.onrender.com/api/missionjeet/course-details?courseid=151
→ https://apiserverpro.onrender.com/api/missionjeet/all-content/151
→ https://apiserverpro.onrender.com/api/missionjeet/content-details?content_id=789&course_id=151
```

---

## API Change Karna (Future me)

Agar kabhi API server change karna ho:

1. Admin Panel → API Management
2. Base URL field me naya URL daalo
3. Test karo
4. Sync karo
5. Done ✅

**Koi code change nahi, koi deployment nahi.**

---

## Firebase Collections (Data kahan store hota hai)

| Collection | Kya store hota hai |
|------------|-------------------|
| `batches` | Synced courses (title, thumbnail, price, category) |
| `courses` | Individual course details (description, mrp) |
| `folders` | Folder content cache (fast loading ke liye) |
| `apiConfig/urls` | Admin ka configured Base URL |

---

## Proxy System (Technical)

Browser directly external API call nahi kar sakta (CORS issue). Isliye ek **proxy** banaya gaya hai:

```
Browser → /api/missionjeet/batches
              ↓
         Proxy (server-side)
              ↓
         Firestore se Base URL read karta hai
              ↓
         External API call karta hai
              ↓
         Response browser ko deta hai
```

Proxy file: `app/api/missionjeet/[...path]/route.js`

---

## Troubleshooting

### "Failed to fetch" error
- Server sleep mode me ho sakta hai (Render free tier)
- Browser me directly URL open karo: `https://yourserver.com/api/missionjeet/batches`
- Agar response aaya → phir Test karo

### "API not configured" error
- Base URL set nahi kiya
- Admin Panel → API Management → URL daalo → Save

### Courses nahi dikh rahe
- Sync nahi kiya
- "Sync Batches → Firebase" click karo

### Thumbnails nahi dikh rahe
- Sync ke baad automatically aate hain
- Hard refresh karo: `Ctrl + Shift + R`

---

## Summary

| Kya karna hai | Kaise |
|---------------|-------|
| Pehli baar setup | Base URL daalo → Test → Sync |
| API change karna | Naya Base URL daalo → Test → Sync |
| Data refresh karna | Sync Batches → Firebase |
| Server check karna | Test button |

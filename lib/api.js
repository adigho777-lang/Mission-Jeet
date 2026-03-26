// Central API layer — ALL API calls go through here
// Base URL comes from Firestore apiConfig (set by admin)
// Frontend NEVER calls APIs directly — only reads from Firebase

import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

// ── Config ────────────────────────────────────────────────────────────────────
const FALLBACK_BASE = 'https://apiserverpro.onrender.com/api/missionjeet';

let _configCache = null;
let _configTime  = 0;

export async function getBaseUrl() {
  if (_configCache && Date.now() - _configTime < 60000) return _configCache;
  try {
    const snap = await getDoc(doc(db, 'apiConfig', 'urls'));
    const base = snap.exists() ? (snap.data().baseUrl || FALLBACK_BASE) : FALLBACK_BASE;
    _configCache = base.replace(/\/$/, '');
    _configTime  = Date.now();
    return _configCache;
  } catch {
    return FALLBACK_BASE;
  }
}

// ── Firebase reads (primary) ──────────────────────────────────────────────────
export async function getBatchesFromFirebase() {
  const snap = await getDocs(collection(db, 'batches'));
  return snap.docs.map(d => d.data());
}

export async function getCourseFromFirebase(courseId) {
  const snap = await getDoc(doc(db, 'courses', String(courseId)));
  return snap.exists() ? snap.data() : null;
}

// ── Proxy API calls (server-side only, via /api/missionjeet proxy) ────────────
// These are used ONLY by the sync system, not by frontend components directly

export async function apiFetchBatches() {
  const res = await fetch('/api/missionjeet/batches', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Batches API ${res.status}`);
  return res.json();
}

export async function apiFetchCourseDetails(courseId) {
  const res = await fetch(`/api/missionjeet/course-details?courseid=${courseId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Course details API ${res.status}`);
  return res.json();
}

export async function apiFetchContent(courseId, folderId) {
  const url = folderId
    ? `/api/missionjeet/all-content/${courseId}?id=${folderId}`
    : `/api/missionjeet/all-content/${courseId}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Content API ${res.status}`);
  return res.json();
}

export async function apiFetchVideoUrl(contentId, courseId) {
  const res = await fetch(`/api/missionjeet/content-details?content_id=${contentId}&course_id=${courseId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Video URL API ${res.status}`);
  return res.json();
}

// ── Parse helpers ─────────────────────────────────────────────────────────────
export function parseBatchList(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) {
    const flat = [];
    json.data.forEach(item => {
      if (Array.isArray(item?.list)) flat.push(...item.list);
      else if (item?.id || item?._id) flat.push(item);
    });
    return flat;
  }
  if (Array.isArray(json?.batches)) return json.batches;
  return [];
}

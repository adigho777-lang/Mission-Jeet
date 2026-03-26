// Central API layer
// Base URL = ONLY from Firestore apiConfig (set by admin)
// No fallbacks, no hardcoded URLs

import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

// ── Firebase reads (what frontend uses) ──────────────────────────────────────

export async function getBatchesFromFirebase() {
  const snap = await getDocs(collection(db, 'batches'));
  return snap.docs.map(d => d.data());
}

export async function getCourseFromFirebase(courseId) {
  const snap = await getDoc(doc(db, 'courses', String(courseId)));
  return snap.exists() ? snap.data() : null;
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

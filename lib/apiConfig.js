// API Config — reads from Firestore `apiConfig` collection
// Falls back to defaults if not configured

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const DEFAULT_APIS = {
  batches:        'https://apiserverpro.onrender.com/api/missionjeet/batches',
  courseDetails:  'https://apiserverpro.onrender.com/api/missionjeet/course-details',
  allContent:     'https://apiserverpro.onrender.com/api/missionjeet/all-content',
  contentDetails: 'https://apiserverpro.onrender.com/api/missionjeet/content-details',
};

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 60000; // 1 min

export async function getApiConfig() {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;
  try {
    const snap = await getDoc(doc(db, 'apiConfig', 'urls'));
    _cache = snap.exists() ? { ...DEFAULT_APIS, ...snap.data() } : { ...DEFAULT_APIS };
    _cacheTime = Date.now();
    return _cache;
  } catch {
    return { ...DEFAULT_APIS };
  }
}

export async function saveApiConfig(updates) {
  await setDoc(doc(db, 'apiConfig', 'urls'), updates, { merge: true });
  _cache = null; // invalidate cache
}

// Fetch with config — uses stored API URLs
export async function apiFetch(key, pathSuffix = '', queryParams = '') {
  const config = await getApiConfig();
  const base = config[key] || DEFAULT_APIS[key];
  if (!base) throw new Error(`Unknown API key: ${key}`);
  const url = `${base}${pathSuffix}${queryParams}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`);
  return res.json();
}

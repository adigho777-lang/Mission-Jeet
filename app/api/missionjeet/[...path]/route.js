import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyArB2FOD3UgvotLVoVCr1Bz7Os4TbPZD8Y",
  authDomain: "mission-jeet-8f2f5.firebaseapp.com",
  projectId: "mission-jeet-8f2f5",
  storageBucket: "mission-jeet-8f2f5.firebasestorage.app",
  messagingSenderId: "1002047948820",
  appId: "1:1002047948820:web:5b6d1597f230299791ff01",
};

let _baseUrl = null;
let _baseTime = 0;

async function getBaseUrl() {
  // Cache for 60 seconds
  if (_baseUrl && Date.now() - _baseTime < 60000) return _baseUrl;

  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db  = getFirestore(app);
    const snap = await getDoc(doc(db, 'apiConfig', 'urls'));
    if (snap.exists() && snap.data().baseUrl) {
      _baseUrl  = snap.data().baseUrl.replace(/\/$/, '');
      _baseTime = Date.now();
      return _baseUrl;
    }
  } catch {}

  return null;
}

export async function GET(req, { params }) {
  try {
    const baseUrl = await getBaseUrl();

    if (!baseUrl) {
      return NextResponse.json({
        error: 'API not configured. Go to Admin Panel → API Management → set Base URL.',
      }, { status: 503 });
    }

    const path = (await params).path.join('/');
    const url  = `${baseUrl}/${path}${req.nextUrl.search}`;

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: res.status });
    }

    const text = await res.text();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Empty response' }, { status: 502 });
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return NextResponse.json({ error: 'Invalid JSON', raw: text.slice(0, 300) }, { status: 502 }); }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

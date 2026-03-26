import { NextResponse } from 'next/server';

// Proxy route — base URL comes from Firestore apiConfig set by admin
// Admin Panel → API Management → Base URL → saved to Firestore → used here

let _baseUrl = null;
let _baseTime = 0;

async function getBaseUrl() {
  if (_baseUrl && Date.now() - _baseTime < 60000) return _baseUrl;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const cred = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'mission-jeet-8f2f5',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
      if (cred.clientEmail && cred.privateKey) {
        admin.initializeApp({ credential: admin.credential.cert(cred) });
      }
    }
    if (admin.apps.length) {
      const snap = await admin.firestore().collection('apiConfig').doc('urls').get();
      if (snap.exists && snap.data().baseUrl) {
        _baseUrl = snap.data().baseUrl.replace(/\/$/, '');
        _baseTime = Date.now();
        return _baseUrl;
      }
    }
  } catch {}
  // Last resort fallback — only used if admin hasn't set a URL yet
  _baseUrl = 'https://apiserverpro.onrender.com/api/missionjeet';
  _baseTime = Date.now();
  return _baseUrl;
}

export async function GET(req, { params }) {
  try {
    const path    = (await params).path.join('/');
    const baseUrl = await getBaseUrl();
    const url     = `${baseUrl}/${path}${req.nextUrl.search}`;

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}: ${url}` }, { status: res.status });
    }

    const text = await res.text();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Empty response from upstream' }, { status: 502 });
    }

    let data;
    try { data = JSON.parse(text); }
    catch { return NextResponse.json({ error: 'Invalid JSON', raw: text.slice(0, 300) }, { status: 502 }); }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

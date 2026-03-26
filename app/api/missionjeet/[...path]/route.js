import { NextResponse } from 'next/server';

// Proxy — base URL comes ONLY from Firestore apiConfig set by admin
// No hardcoded fallback

async function getBaseUrl() {
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
        return snap.data().baseUrl.replace(/\/$/, '');
      }
    }
  } catch {}
  return null; // No URL configured
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

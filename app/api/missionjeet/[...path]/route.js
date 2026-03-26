import { NextResponse } from 'next/server';

// Dynamic API proxy — base URL comes from Firestore apiConfig
// Falls back to default if not configured

async function getBaseUrl() {
  try {
    // Server-side: use Firebase Admin to read config
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
      if (snap.exists && snap.data().baseUrl) return snap.data().baseUrl;
    }
  } catch {}
  return 'https://apiserverpro.onrender.com/api/missionjeet';
}

export async function GET(req, { params }) {
  try {
    const path = (await params).path.join('/');
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/${path}${req.nextUrl.search}`;

    console.log('🔥 Proxying:', url);

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream API error: ${res.status}` }, { status: res.status });
    }

    const text = await res.text();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Empty response from upstream' }, { status: 502 });
    }

    let data;
    try { data = JSON.parse(text); }
    catch {
      return NextResponse.json({ error: 'Invalid JSON from upstream', raw: text.slice(0, 500) }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('❌ Proxy Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

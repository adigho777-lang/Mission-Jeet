import { NextResponse } from 'next/server';

// Proxy route — reads base URL from Firestore via REST API (no SDK needed)
// This avoids any Firebase SDK import issues in server routes

let _baseUrl = null;
let _baseTime = 0;

async function getBaseUrl() {
  if (_baseUrl && Date.now() - _baseTime < 60000) return _baseUrl;

  try {
    // Use Firestore REST API directly — no SDK import needed
    const projectId = 'mission-jeet-8f2f5';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/apiConfig/urls`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const baseUrl = data?.fields?.baseUrl?.stringValue;
      if (baseUrl) {
        _baseUrl  = baseUrl.replace(/\/$/, '');
        _baseTime = Date.now();
        return _baseUrl;
      }
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

import { NextResponse } from 'next/server';

// Proxy — reads base URL from Firestore REST API on every request (no cache)

const PROJECT_ID = 'mission-jeet-8f2f5';

async function getBaseUrl() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/apiConfig/urls`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const base = data?.fields?.baseUrl?.stringValue;
      if (base) return base.replace(/\/$/, '');
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
      signal: AbortSignal.timeout(20000),
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

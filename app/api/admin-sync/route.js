import { NextResponse } from 'next/server';

// Admin sync: Firestore REST API → fetch external API → return data for client-side save

const PROJECT_ID = 'mission-jeet-8f2f5';

async function getBaseUrl() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/apiConfig/urls`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data?.fields?.baseUrl?.stringValue?.replace(/\/$/, '') || null;
    }
  } catch {}
  return null;
}

function parseBatches(json) {
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

export async function POST(req) {
  try {
    const { type } = await req.json();

    const baseUrl = await getBaseUrl();
    if (!baseUrl) {
      return NextResponse.json({
        error: 'No API URL configured. Go to Admin Panel → API Management → set Base URL first.',
        success: false,
      }, { status: 400 });
    }

    const results = {};

    if (type === 'batches' || type === 'all') {
      const url = `${baseUrl}/batches`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return NextResponse.json({
          error: `Batches API returned ${res.status}. URL: ${url}`,
          success: false,
        }, { status: 400 });
      }

      const json = await res.json();
      const list = parseBatches(json);

      if (list.length === 0) {
        return NextResponse.json({
          error: `API returned 0 batches. URL: ${url}. Response: ${JSON.stringify(json).slice(0, 200)}`,
          success: false,
        }, { status: 400 });
      }

      // Return data — client saves to Firestore directly
      results.batches = { total: list.length, data: list };
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ error: e.message, success: false }, { status: 500 });
  }
}

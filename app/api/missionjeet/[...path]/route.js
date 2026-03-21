import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const path = (await params).path.join('/');
    const url = `https://apiserverpro.onrender.com/api/missionjeet/${path}${req.nextUrl.search}`;

    console.log('\uD83D\uDD25 Proxying:', url);

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream API error: ${res.status}` },
        { status: res.status }
      );
    }

    const text = await res.text();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Empty response from upstream' }, { status: 502 });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('\u274C JSON parse failed. Raw:', text.slice(0, 200));
      return NextResponse.json({ error: 'Invalid JSON from upstream', raw: text.slice(0, 500) }, { status: 502 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error('\u274C Proxy Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

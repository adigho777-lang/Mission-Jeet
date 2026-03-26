import { NextResponse } from 'next/server';

// Admin sync: reads base URL from Firestore REST API → fetches from external API → stores in Firestore
// Uses Firestore REST API to avoid firebase-admin SDK issues

async function getAdminConfig() {
  const projectId = 'mission-jeet-8f2f5';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/apiConfig/urls`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        baseUrl: data?.fields?.baseUrl?.stringValue || null,
      };
    }
  } catch {}
  return { baseUrl: null };
}

async function saveToFirestore(collection, docId, fields) {
  const projectId = 'mission-jeet-8f2f5';
  // Use Firestore REST API to write data
  // Note: This requires Firestore rules to allow writes, or use Admin SDK
  // For now we return the data for client-side save
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

    const config = await getAdminConfig();

    if (!config.baseUrl) {
      return NextResponse.json({
        error: 'No API URL configured. Go to Admin Panel → API Management → set Base URL first.',
        success: false,
      }, { status: 400 });
    }

    const baseUrl = config.baseUrl.replace(/\/$/, '');
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
          error: `Batches API returned ${res.status}. URL tried: ${url}`,
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

      // Return data for client-side save to Firestore
      results.batches = { total: list.length, data: list };
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ error: e.message, success: false }, { status: 500 });
  }
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
    const admin = getAdmin();
    const db = admin?.firestore();

    // Get base URL from Firestore — NO fallback
    let baseUrl = null;
    if (db) {
      const snap = await db.collection('apiConfig').doc('urls').get();
      if (snap.exists && snap.data().baseUrl) {
        baseUrl = snap.data().baseUrl.replace(/\/$/, '');
      }
    }

    if (!baseUrl) {
      return NextResponse.json({
        error: 'No API URL configured. Go to Admin Panel → API Management → set Base URL first.',
        success: false,
      }, { status: 400 });
    }

    const results = {};

    // ── Sync Batches ──────────────────────────────────────────────────────────
    if (type === 'batches' || type === 'all') {
      const url = `${baseUrl}/batches`;

      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return NextResponse.json({
          error: `Batches API returned ${res.status}. URL tried: ${url}`,
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

      if (db) {
        const batch = db.batch();
        let updated = 0, added = 0;

        for (const item of list) {
          const id = String(item.id || item._id || item.batch_id || '');
          if (!id) continue;

          const ref = db.collection('batches').doc(id);
          const existing = await ref.get();

          const titleLower = (item.title || '').toLowerCase();
          let category = (item.category || item.classType || '').toLowerCase();
          if (!category) {
            if (titleLower.includes('neet')) category = 'neet';
            else if (titleLower.includes('jee')) category = 'jee';
          }

          const data = {
            id,
            title: item.title || item.name || '',
            category,
            thumbnail: item.thumbnail || item.image || item.banner || '',
            price: Number(item.price || item.mrp || 0),
            finalPrice: Number(item.finalPrice || item.offer_price || item.discounted_price || item.price || 0),
            description: item.description || item.about || '',
            slug: item.slug || id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (existing.exists) { batch.update(ref, data); updated++; }
          else { batch.set(ref, { ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() }); added++; }
        }

        await batch.commit();
        results.batches = { total: list.length, updated, added };
      } else {
        // No Admin SDK — return raw data for client-side save
        results.batches = { total: list.length, data: list };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ error: e.message, success: false }, { status: 500 });
  }
}

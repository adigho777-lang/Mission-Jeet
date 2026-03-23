import { NextResponse } from 'next/server';

// Auto-sync API data to Firestore
// Called by Vercel cron every 5 minutes

let adminApp = null;

function getAdmin() {
  if (adminApp) return adminApp;
  try {
    const admin = require('firebase-admin');
    if (admin.apps.length > 0) {
      adminApp = admin;
      return admin;
    }
    const cred = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'mission-jeet-8f2f5',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    if (!cred.clientEmail || !cred.privateKey) return null;
    admin.initializeApp({ credential: admin.credential.cert(cred) });
    adminApp = admin;
    return admin;
  } catch (e) {
    console.error('Admin init failed:', e);
    return null;
  }
}

export async function GET(req) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });

  const db = admin.firestore();
  const API_BASE = 'https://apiserverpro.onrender.com/api/missionjeet';

  try {
    // Fetch batches from API
    const batchesRes = await fetch(`${API_BASE}/batches`);
    const batches = await batchesRes.json();

    let updated = 0;
    let added = 0;

    // Sync each batch to Firestore
    for (const batch of batches) {
      const docRef = db.collection('courses').doc(String(batch.id));
      const doc = await docRef.get();

      const data = {
        id: batch.id,
        title: batch.title || '',
        category: batch.category || '',
        thumbnail: batch.thumbnail || '',
        price: batch.price || 0,
        finalPrice: batch.finalPrice || batch.price || 0,
        description: batch.description || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (doc.exists) {
        // Update only if data changed
        const existing = doc.data();
        const changed = Object.keys(data).some(k => {
          if (k === 'updatedAt') return false;
          return JSON.stringify(existing[k]) !== JSON.stringify(data[k]);
        });
        if (changed) {
          await docRef.update(data);
          updated++;
        }
      } else {
        // Add new course
        await docRef.set({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        added++;
      }
    }

    return NextResponse.json({ success: true, updated, added, total: batches.length });
  } catch (e) {
    console.error('Sync error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

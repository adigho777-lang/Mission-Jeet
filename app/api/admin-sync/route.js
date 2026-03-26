import { NextResponse } from 'next/server';

// Admin-triggered sync: fetches from configured APIs → stores in Firestore
// Called from admin panel when admin clicks "Sync Now"

let adminApp = null;

function getAdmin() {
  if (adminApp) return adminApp;
  try {
    const admin = require('firebase-admin');
    if (admin.apps.length > 0) { adminApp = admin; return admin; }
    const cred = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'mission-jeet-8f2f5',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    if (!cred.clientEmail || !cred.privateKey) return null;
    admin.initializeApp({ credential: admin.credential.cert(cred) });
    adminApp = admin;
    return admin;
  } catch (e) { console.error('Admin init failed:', e); return null; }
}

export async function POST(req) {
  try {
    const { type } = await req.json(); // type: 'batches' | 'all'

    const admin = getAdmin();
    const db = admin ? admin.firestore() : null;

    // Get API config from Firestore
    let apiConfig = {};
    if (db) {
      const configSnap = await db.collection('apiConfig').doc('urls').get();
      if (configSnap.exists) apiConfig = configSnap.data();
    }

    const APIS = {
      batches:        apiConfig.batches        || 'https://apiserverpro.onrender.com/api/missionjeet/batches',
      courseDetails:  apiConfig.courseDetails  || 'https://apiserverpro.onrender.com/api/missionjeet/course-details',
      allContent:     apiConfig.allContent     || 'https://apiserverpro.onrender.com/api/missionjeet/all-content',
      contentDetails: apiConfig.contentDetails || 'https://apiserverpro.onrender.com/api/missionjeet/content-details',
    };

    const results = {};

    // Sync batches
    if (type === 'batches' || type === 'all') {
      const res = await fetch(APIS.batches, { cache: 'no-store' });
      const batches = await res.json();
      const list = Array.isArray(batches) ? batches : batches?.data || [];

      if (db) {
        let updated = 0, added = 0;
        for (const batch of list) {
          const id = String(batch.id || batch._id);
          const ref = db.collection('courses').doc(id);
          const existing = await ref.get();
          const data = {
            id,
            title: batch.title || '',
            category: (batch.category || '').toLowerCase(),
            thumbnail: batch.thumbnail || batch.image || '',
            price: Number(batch.price || 0),
            finalPrice: Number(batch.finalPrice || batch.offer_price || batch.price || 0),
            description: batch.description || '',
            slug: batch.slug || id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          if (existing.exists) { await ref.update(data); updated++; }
          else { await ref.set({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() }); added++; }
        }
        results.batches = { total: list.length, updated, added };
      } else {
        results.batches = { total: list.length, note: 'Admin SDK not configured, data not saved to Firestore' };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    console.error('Sync error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

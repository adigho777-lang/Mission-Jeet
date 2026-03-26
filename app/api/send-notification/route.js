import { NextResponse } from 'next/server';

// FCM Push Notification Sender using Firebase Admin SDK (ESM-safe)

let _messaging = null;

async function getMessaging() {
  if (_messaging) return _messaging;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId   = process.env.FIREBASE_PROJECT_ID || 'mission-jeet-8f2f5';

  if (!clientEmail || !privateKey) return null;

  try {
    const { default: admin } = await import('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    }
    _messaging = admin.messaging();
    return _messaging;
  } catch (e) {
    console.error('Firebase Admin init failed:', e.message);
    return null;
  }
}

export async function POST(req) {
  try {
    const { fcmToken, title, body, data } = await req.json();

    if (!fcmToken || !title) {
      return NextResponse.json({ error: 'Missing fcmToken or title' }, { status: 400 });
    }

    const messaging = await getMessaging();

    if (!messaging) {
      return NextResponse.json({
        error: 'Firebase Admin not configured. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to Vercel environment variables.',
        success: false,
      }, { status: 500 });
    }

    const response = await messaging.send({
      token: fcmToken,
      notification: { title, body: body || '' },
      data: data || {},
      webpush: {
        notification: {
          icon: '/mission-jeet.jpg',
          badge: '/mission-jeet.jpg',
          requireInteraction: true,
        },
        fcmOptions: { link: data?.url || '/live-classes' },
      },
    });

    return NextResponse.json({ success: true, messageId: response });
  } catch (error) {
    let msg = error.message;
    if (error.code === 'messaging/invalid-registration-token') msg = 'Invalid FCM token.';
    if (error.code === 'messaging/registration-token-not-registered') msg = 'FCM token expired.';
    return NextResponse.json({ error: msg, success: false, code: error.code }, { status: 500 });
  }
}

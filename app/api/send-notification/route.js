import { NextResponse } from 'next/server';

// FCM Push Notification Sender
// Uses Firebase Admin SDK to send notifications to user devices

let admin;
let messaging;

function initAdmin() {
  if (admin) return messaging;
  
  try {
    admin = require('firebase-admin');
    
    // Check if already initialized
    if (admin.apps.length > 0) {
      messaging = admin.messaging();
      return messaging;
    }

    // Initialize with service account (from environment variables)
    // For Vercel: Add these as environment variables in project settings
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'mission-jeet-8f2f5',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // If no credentials, try to initialize without them (will fail for messaging)
    if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
      console.warn('⚠️ Firebase Admin credentials not found. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Vercel environment variables.');
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    messaging = admin.messaging();
    console.log('✅ Firebase Admin initialized');
    return messaging;
    
  } catch (error) {
    console.error('❌ Firebase Admin init failed:', error);
    return null;
  }
}

export async function POST(req) {
  try {
    const { fcmToken, title, body, data } = await req.json();

    if (!fcmToken || !title) {
      return NextResponse.json({ error: 'Missing fcmToken or title' }, { status: 400 });
    }

    console.log('📤 Sending notification:', { title, body, token: fcmToken.substring(0, 20) + '...' });

    // Initialize Firebase Admin
    const messaging = initAdmin();
    
    if (!messaging) {
      console.error('❌ Firebase Admin not initialized. Check environment variables.');
      return NextResponse.json({ 
        error: 'Firebase Admin not configured. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to Vercel environment variables.',
        success: false 
      }, { status: 500 });
    }

    // Send notification
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body || '',
      },
      data: data || {},
      webpush: {
        notification: {
          icon: '/mission-jeet.jpg',
          badge: '/mission-jeet.jpg',
          requireInteraction: true,
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: data?.url || '/live-classes',
        },
      },
    };

    const response = await messaging.send(message);
    console.log('✅ Notification sent successfully:', response);

    return NextResponse.json({ 
      success: true, 
      messageId: response,
    });

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.code === 'messaging/invalid-registration-token') {
      errorMessage = 'Invalid FCM token. User may need to re-enable notifications.';
    } else if (error.code === 'messaging/registration-token-not-registered') {
      errorMessage = 'FCM token expired. User needs to re-enable notifications.';
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      success: false,
      code: error.code,
    }, { status: 500 });
  }
}


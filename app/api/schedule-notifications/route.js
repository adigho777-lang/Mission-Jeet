import { NextResponse } from 'next/server';

// This endpoint is called by Vercel Cron every minute
// It checks upcoming live classes and sends notifications at the right times

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
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });

  const db = admin.firestore();
  const messaging = admin.messaging();
  const now = Date.now();

  try {
    // Get all upcoming/live classes
    const classesSnap = await db.collection('liveClasses')
      .where('completed', '==', false)
      .get();

    const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get all users with FCM tokens
    const usersSnap = await db.collection('users')
      .where('fcmToken', '!=', null)
      .get();

    const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

    let sent = 0;
    const notifLog = [];

    for (const cls of classes) {
      const startMs = cls.startTime?.toMillis?.() ?? Number(cls.startTime) ?? 0;
      if (!startMs) continue;

      const diffMin = (startMs - now) / 60000; // minutes until start

      // Determine which notification to send
      let notifType = null;
      if (diffMin > 59 && diffMin <= 61) notifType = '1hr';
      else if (diffMin > 4 && diffMin <= 6) notifType = '5min';
      else if (diffMin > -1 && diffMin <= 1) notifType = 'start';

      if (!notifType) continue;

      // Check if we already sent this notification (avoid duplicates)
      const sentKey = `notif_${cls.id}_${notifType}`;
      const sentDoc = await db.collection('notifLog').doc(sentKey).get();
      if (sentDoc.exists) continue;

      // Mark as sent immediately to prevent duplicates
      await db.collection('notifLog').doc(sentKey).set({ sentAt: now, classId: cls.id, type: notifType });

      // Build notification content
      const titles = {
        '1hr':   `\u23F0 1 Hour to Go — ${cls.title}`,
        '5min':  `\u26A1 Starting in 5 Min — ${cls.title}`,
        'start': `\uD83D\uDD34 Live Now — ${cls.title}`,
      };
      const bodies = {
        '1hr':   `${cls.batchName || 'Live class'} starts in 1 hour. Get ready!`,
        '5min':  `${cls.batchName || 'Live class'} is starting in 5 minutes. Join now!`,
        'start': `${cls.batchName || 'Live class'} has started! Join now.`,
      };

      const title = titles[notifType];
      const body = bodies[notifType];

      // Send to enrolled users (or all users if no enrollment tracking)
      const targetUsers = users.filter(u => {
        if (!u.fcmToken) return false;
        // If user has enrolledCourses, check if they're enrolled in this batch
        if (u.enrolledCourses && cls.courseId) {
          return u.enrolledCourses.includes(cls.courseId);
        }
        // If no enrollment data, send to users matching category
        if (cls.category && u.classType) {
          return u.classType.toLowerCase() === cls.category.toLowerCase();
        }
        // Fallback: send to all users with tokens
        return true;
      });

      // Send notifications in batches of 500
      const tokens = targetUsers.map(u => u.fcmToken).filter(Boolean);
      if (tokens.length === 0) continue;

      // FCM multicast (up to 500 tokens at once)
      for (let i = 0; i < tokens.length; i += 500) {
        const batch = tokens.slice(i, i + 500);
        try {
          const result = await messaging.sendEachForMulticast({
            tokens: batch,
            notification: { title, body },
            webpush: {
              notification: {
                icon: '/mission-jeet.jpg',
                badge: '/mission-jeet.jpg',
                requireInteraction: true,
                vibrate: [200, 100, 200],
              },
              fcmOptions: { link: cls.videoUrl || '/live-classes' },
            },
            data: { classId: cls.id, url: cls.videoUrl || '/live-classes', type: notifType },
          });
          sent += result.successCount;
          notifLog.push({ class: cls.title, type: notifType, sent: result.successCount, failed: result.failureCount });
        } catch (e) {
          console.error('Multicast error:', e);
        }
      }
    }

    return NextResponse.json({ success: true, sent, log: notifLog });
  } catch (e) {
    console.error('Schedule notifications error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

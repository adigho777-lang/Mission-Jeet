import { NextResponse } from 'next/server';

// Notification scheduler — called manually or by cron
// Uses Firestore REST API to avoid firebase-admin SDK ESM issues

const PROJECT_ID = 'mission-jeet-8f2f5';

async function firestoreGet(path) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function firestoreList(collection) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data?.documents || [];
}

function getField(doc, field) {
  const f = doc?.fields?.[field];
  if (!f) return null;
  return f.stringValue ?? f.integerValue ?? f.booleanValue ?? f.timestampValue ?? null;
}

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = Date.now();
    const classes = await firestoreList('liveClasses');
    const users   = await firestoreList('users');

    let sent = 0;

    for (const cls of classes) {
      if (getField(cls, 'completed') === true) continue;

      const startTs = getField(cls, 'startTime');
      if (!startTs) continue;

      const startMs = typeof startTs === 'string'
        ? new Date(startTs).getTime()
        : Number(startTs);

      const diffMin = Math.floor((startMs - now) / 60000);

      let notifType = null;
      if (diffMin >= 59 && diffMin <= 61) notifType = '1hr';
      else if (diffMin >= 4 && diffMin <= 6) notifType = '5min';
      else if (diffMin >= -1 && diffMin <= 1) notifType = 'start';

      if (!notifType) continue;

      const classId = cls.name?.split('/').pop();
      const sentKey = `notif_${classId}_${notifType}`;

      // Check if already sent
      const logDoc = await firestoreGet(`notifLog/${sentKey}`);
      if (logDoc && !logDoc.error) continue;

      const titles = {
        '1hr':   `⏰ 1 Hour to Go — ${getField(cls, 'title')}`,
        '5min':  `⚡ Starting in 5 Min — ${getField(cls, 'title')}`,
        'start': `🔴 Live Now — ${getField(cls, 'title')}`,
      };
      const bodies = {
        '1hr':   `${getField(cls, 'batchName') || 'Live class'} starts in 1 hour!`,
        '5min':  `${getField(cls, 'batchName') || 'Live class'} starts in 5 minutes!`,
        'start': `${getField(cls, 'batchName') || 'Live class'} is LIVE now!`,
      };

      for (const user of users) {
        const token = getField(user, 'fcmToken');
        if (!token) continue;

        try {
          await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fcmToken: token,
              title: titles[notifType],
              body: bodies[notifType],
              data: { classId, url: getField(cls, 'videoUrl') || '/live-classes' },
            }),
          });
          sent++;
        } catch {}
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

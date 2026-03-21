'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import { scheduleNotifications, requestNotificationPermission } from '@/lib/notifications';

export default function LiveClassesPage() {
  const { user } = useAuth();
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('all');   // all | jee | neet
  const [notified, setNotified] = useState({});      // classId → true

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, 'liveClasses'), orderBy('startTime', 'asc')));
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setClasses(data);
        // schedule browser notifications for upcoming classes
        requestNotificationPermission().then(() => {
          data.forEach((c) => scheduleNotifications(c));
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const now = Date.now();

  function getStatus(c) {
    const start = c.startTime?.toMillis?.() ?? Number(c.startTime) ?? 0;
    const end   = c.endTime?.toMillis?.()   ?? Number(c.endTime)   ?? 0;
    if (c.completed || (end && now > end)) return 'completed';
    if (start && now >= start)             return 'live';
    return 'upcoming';
  }

  const filtered = classes.filter((c) => {
    if (tab !== 'all') {
      const cat = (c.category ?? '').toLowerCase();
      if (cat && cat !== tab) return false;
    }
    return true;
  });

  const upcoming  = filtered.filter((c) => getStatus(c) === 'upcoming');
  const live      = filtered.filter((c) => getStatus(c) === 'live');
  const completed = filtered.filter((c) => getStatus(c) === 'completed');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1100px] mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-6">
          <Link href="/" className="hover:underline">Home</Link>
          <span>&#8250;</span>
          <span>Live Classes</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-[22px] font-bold text-black">Live Classes</h1>

          {/* Category filter */}
          <div className="flex gap-2">
            {['all', 'jee', 'neet'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold uppercase transition-colors ${
                  tab === t ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="bg-gray-200 rounded-lg shrink-0" style={{ width: 120, height: 80 }} />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            <Section title="🔴 Live Now" items={live} status="live" user={user} notified={notified} setNotified={setNotified} />
            <Section title="📅 Upcoming" items={upcoming} status="upcoming" user={user} notified={notified} setNotified={setNotified} />
            <Section title="✅ Completed" items={completed} status="completed" user={user} notified={notified} setNotified={setNotified} />
            {live.length === 0 && upcoming.length === 0 && completed.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-16">No classes scheduled yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, items, status, user, notified, setNotified }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-8">
      <h2 className="text-[15px] font-bold text-black mb-3">{title}</h2>
      <div className="space-y-3">
        {items.map((c) => (
          <ClassCard key={c.id} data={c} status={status} user={user} notified={notified} setNotified={setNotified} />
        ))}
      </div>
    </div>
  );
}

function ClassCard({ data, status, user, notified, setNotified }) {
  const start = data.startTime?.toMillis?.() ?? Number(data.startTime) ?? 0;

  function handleNotify() {
    if (!user) { window.location.href = '/login'; return; }
    scheduleNotifications(data);
    setNotified((p) => ({ ...p, [data.id]: true }));
    alert('You\'ll be notified 5 min before the class starts.');
  }

  return (
    <div className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
      {/* Thumbnail */}
      <div className="shrink-0 rounded-lg overflow-hidden bg-gray-100" style={{ width: 120, height: 80 }}>
        {data.thumbnail
          ? <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">&#127909;</div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-[14px] font-semibold text-black leading-snug">{data.title}</p>
            {data.batchName && <p className="text-[11px] text-gray-500 mt-0.5">{data.batchName}</p>}
          </div>
          {data.category && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
              {data.category}
            </span>
          )}
        </div>

        {start > 0 && (
          <p className="text-[11px] text-gray-500 mt-1">
            {new Date(start).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}

        <div className="mt-2 flex gap-2 flex-wrap">
          {status === 'live' && data.videoUrl && (
            <a
              href={data.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[12px] font-semibold px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Join Now
            </a>
          )}
          {status === 'upcoming' && (
            <button
              onClick={handleNotify}
              className={`text-[12px] font-semibold px-4 py-1.5 rounded-lg border transition-colors ${
                notified[data.id]
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'border-gray-300 text-gray-700 hover:border-black'
              }`}
            >
              {notified[data.id] ? '\u2713 Notified' : '\uD83D\uDD14 Notify Me'}
            </button>
          )}
          {status === 'completed' && data.videoUrl && (
            <a
              href={data.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[12px] font-semibold px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:border-black transition-colors"
            >
              Watch Recording
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [tab,   setTab]   = useState('jee');
  const [rows,  setRows]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch all users ordered by xp, filter client-side to avoid composite index requirement
        const q = query(
          collection(db, 'users'),
          orderBy('xp', 'desc'),
          limit(100)
        );
        const snap = await getDocs(q);
        const all  = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRows(all.filter((r) => !r.classType || r.classType === tab).slice(0, 50));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tab]);

  return (
    <div className="max-w-[700px] mx-auto px-6 py-10">
      <h1 className="text-[22px] font-bold text-black mb-2">Leaderboard</h1>
      <p className="text-[13px] text-gray-500 mb-6">Top students by XP earned from watching lectures</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['jee', 'neet'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-[13px] font-semibold uppercase transition-colors ${
              tab === t ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-10">No data yet. Start watching to earn XP!</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => {
            const isMe = user?.uid === row.id;
            const medal = i === 0 ? '&#127947;' : i === 1 ? '&#129352;' : i === 2 ? '&#129353;' : null;
            return (
              <div
                key={row.id}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                  isMe ? 'border-black bg-black text-white' : 'border-gray-200 bg-white'
                }`}
              >
                <span className="w-7 text-center text-[13px] font-bold shrink-0">
                  {medal ? <span dangerouslySetInnerHTML={{ __html: medal }} /> : `#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold truncate ${isMe ? 'text-white' : 'text-gray-800'}`}>
                    {row.name || row.email?.split('@')[0] || 'Student'}
                    {isMe && <span className="ml-2 text-[10px] font-normal opacity-70">(you)</span>}
                  </p>
                </div>
                <span className={`text-[13px] font-bold shrink-0 ${isMe ? 'text-white' : 'text-black'}`}>
                  {row.xp ?? 0} XP
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* My rank if not in top 50 */}
      {profile && !rows.find((r) => r.id === user?.uid) && (
        <div className="mt-4 flex items-center gap-4 px-4 py-3 rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <span className="text-[13px] text-gray-500 flex-1">Your XP</span>
          <span className="text-[13px] font-bold text-black">{profile.xp ?? 0} XP</span>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, orderBy, query,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

const ADMIN_EMAIL = 'adityaghoghari01@gmail.com';

// ── helpers ──────────────────────────────────────────────────────────────────
const inp = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-black bg-white';

const EMPTY_CLASS = {
  title: '', batchName: '', category: 'jee',
  thumbnail: '', videoUrl: '', startTime: '', endTime: '', completed: false,
};

const EMPTY_VIDEO = {
  title: '', courseId: '', thumbnail: '', videoUrl: '', type: 'hls',
};

function toTimestamp(dtLocal) {
  return dtLocal ? new Date(dtLocal).getTime() : null;
}
function toLocal(ts) {
  if (!ts) return '';
  return new Date(typeof ts === 'number' ? ts : ts.toMillis?.() ?? 0).toISOString().slice(0, 16);
}
function fmtStudy(secs) {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('classes');

  const isAdmin = user?.email === ADMIN_EMAIL;

  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  if (!user || !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500 font-semibold text-lg">Access Denied</p>
    </div>
  );

  const TABS = ['classes', 'content', 'users', 'stats'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[960px] mx-auto px-4 py-8">
        <h1 className="text-[20px] font-bold text-black mb-6">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-[13px] font-semibold capitalize transition-colors ${
                tab === t ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-black'
              }`}
            >{t}</button>
          ))}
          <button onClick={() => setTab('notifications')}
            className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${tab === 'notifications' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-black'}`}
          >📢 Notifications</button>
          <button onClick={() => setTab('apis')}
            className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-colors ${tab === 'apis' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-black'}`}
          >🔌 API Management</button>
        </div>

        {tab === 'classes'       && <ClassesTab />}
        {tab === 'content'       && <ContentTab />}
        {tab === 'users'         && <UsersTab />}
        {tab === 'stats'         && <StatsTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'apis'          && <ApiManagementTab />}
      </div>
    </div>
  );
}

// ── Live Classes Tab ──────────────────────────────────────────────────────────
function ClassesTab() {
  const [classes, setClasses] = useState([]);
  const [form,    setForm]    = useState(EMPTY_CLASS);
  const [saving,  setSaving]  = useState(false);
  const [editId,  setEditId]  = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const snap = await getDocs(query(collection(db, 'liveClasses'), orderBy('startTime', 'asc')));
      setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {}
  }

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, startTime: toTimestamp(form.startTime), endTime: toTimestamp(form.endTime), updatedAt: Date.now() };
      if (editId) await updateDoc(doc(db, 'liveClasses', editId), payload);
      else        await addDoc(collection(db, 'liveClasses'), { ...payload, createdAt: Date.now() });
      setForm(EMPTY_CLASS); setEditId(null); await load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm('Delete?')) return;
    await deleteDoc(doc(db, 'liveClasses', id)); await load();
  }

  async function toggleComplete(c) {
    await updateDoc(doc(db, 'liveClasses', c.id), { completed: !c.completed }); await load();
  }

  function edit(c) {
    setForm({ ...c, startTime: toLocal(c.startTime), endTime: toLocal(c.endTime) });
    setEditId(c.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-[14px] font-bold mb-4">{editId ? 'Edit Class' : 'Add Live Class'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inp} placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className={inp} placeholder="Batch name" value={form.batchName} onChange={(e) => setForm({ ...form, batchName: e.target.value })} />
          <input className={inp} placeholder="Thumbnail URL" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
          <input className={inp} placeholder="Video / Stream URL" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Start Time</label>
            <input type="datetime-local" className={inp} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">End Time</label>
            <input type="datetime-local" className={inp} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Category</label>
            <select className={inp} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="jee">JEE</option>
              <option value="neet">NEET</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="comp" checked={form.completed} onChange={(e) => setForm({ ...form, completed: e.target.checked })} />
            <label htmlFor="comp" className="text-[13px] text-gray-600">Mark as completed</label>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={save} disabled={saving} className="bg-black text-white text-[13px] font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : editId ? 'Update' : 'Add Class'}
          </button>
          {editId && <button onClick={() => { setForm(EMPTY_CLASS); setEditId(null); }} className="text-[13px] text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-400">Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        {classes.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No classes yet.</p>}
        {classes.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            {c.thumbnail && <img src={c.thumbnail} alt="" className="rounded-lg object-cover shrink-0" style={{ width: 80, height: 54 }} />}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-black truncate">{c.title}</p>
              <p className="text-[11px] text-gray-500">{c.startTime ? new Date(c.startTime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'} &middot; {c.category?.toUpperCase()}</p>
              {c.completed && <span className="text-[10px] text-green-600 font-semibold">Completed</span>}
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <button onClick={() => toggleComplete(c)} className="text-[11px] px-3 py-1 rounded border border-gray-200 hover:border-black transition-colors">{c.completed ? 'Unmark' : 'Complete'}</button>
              <button onClick={() => edit(c)} className="text-[11px] px-3 py-1 rounded border border-gray-200 hover:border-black transition-colors">Edit</button>
              <button onClick={() => del(c.id)} className="text-[11px] px-3 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Content (Videos) Tab ──────────────────────────────────────────────────────
function ContentTab() {
  const [videos,  setVideos]  = useState([]);
  const [form,    setForm]    = useState(EMPTY_VIDEO);
  const [saving,  setSaving]  = useState(false);
  const [editId,  setEditId]  = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const snap = await getDocs(collection(db, 'videos'));
      setVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {}
  }

  async function save() {
    if (!form.title.trim() || !form.videoUrl.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, updatedAt: Date.now() };
      if (editId) await updateDoc(doc(db, 'videos', editId), payload);
      else        await addDoc(collection(db, 'videos'), { ...payload, createdAt: Date.now() });
      setForm(EMPTY_VIDEO); setEditId(null); await load();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm('Delete?')) return;
    await deleteDoc(doc(db, 'videos', id)); await load();
  }

  function edit(v) {
    setForm({ title: v.title ?? '', courseId: v.courseId ?? '', thumbnail: v.thumbnail ?? '', videoUrl: v.videoUrl ?? '', type: v.type ?? 'hls' });
    setEditId(v.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-[14px] font-bold mb-4">{editId ? 'Edit Video' : 'Add Video / Content'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={inp} placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className={inp} placeholder="Course ID" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} />
          <input className={inp} placeholder="Thumbnail URL" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
          <input className={inp} placeholder="Video URL (YouTube / M3U8 / MP4) *" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Type</label>
            <select className={inp} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="hls">HLS (.m3u8)</option>
              <option value="youtube">YouTube</option>
              <option value="mp4">MP4</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={save} disabled={saving} className="bg-black text-white text-[13px] font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : editId ? 'Update' : 'Add Content'}
          </button>
          {editId && <button onClick={() => { setForm(EMPTY_VIDEO); setEditId(null); }} className="text-[13px] text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-400">Cancel</button>}
        </div>
      </div>

      <div className="space-y-3">
        {videos.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No videos added yet.</p>}
        {videos.map((v) => (
          <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
            {v.thumbnail && <img src={v.thumbnail} alt="" className="rounded-lg object-cover shrink-0" style={{ width: 80, height: 54 }} />}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-black truncate">{v.title}</p>
              <p className="text-[11px] text-gray-500 truncate">{v.videoUrl}</p>
              <span className="text-[10px] font-mono uppercase text-gray-400">{v.type}</span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => edit(v)} className="text-[11px] px-3 py-1 rounded border border-gray-200 hover:border-black transition-colors">Edit</button>
              <button onClick={() => del(v.id)} className="text-[11px] px-3 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <p className="text-gray-400 text-sm text-center py-8">Loading users...</p>;

  const online = users.filter((u) => u.online).length;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Users',  value: users.length },
          { label: 'Online Now',   value: online },
          { label: 'Avg Study',    value: fmtStudy(Math.floor(users.reduce((a, u) => a + (u.studyTime ?? 0), 0) / (users.length || 1))) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-[26px] font-bold text-black">{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">User</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Class</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">XP</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Study Time</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-black truncate max-w-[160px]">{u.name ?? u.email ?? u.id}</p>
                  <p className="text-gray-400 text-[10px] truncate max-w-[160px]">{u.email}</p>
                </td>
                <td className="px-4 py-3 uppercase text-gray-600">{u.classType ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{u.xp ?? 0}</td>
                <td className="px-4 py-3 text-gray-600">{fmtStudy(u.studyTime)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    u.online ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {u.online ? 'Online' : 'Offline'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No users yet.</p>}
      </div>
    </>
  );
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [usersSnap, progressSnap, classesSnap, videosSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'progress')),
          getDocs(collection(db, 'liveClasses')),
          getDocs(collection(db, 'videos')),
        ]);
        const users = usersSnap.docs.map((d) => d.data());
        setStats({
          totalUsers:    usersSnap.size,
          onlineUsers:   users.filter((u) => u.online).length,
          progressDocs:  progressSnap.size,
          liveClasses:   classesSnap.size,
          videos:        videosSnap.size,
          totalStudy:    fmtStudy(users.reduce((a, u) => a + (u.studyTime ?? 0), 0)),
          totalXP:       users.reduce((a, u) => a + (u.xp ?? 0), 0),
        });
      } catch {}
    }
    load();
  }, []);

  const items = stats ? [
    { label: 'Total Users',    value: stats.totalUsers },
    { label: 'Online Now',     value: stats.onlineUsers },
    { label: 'Progress Docs',  value: stats.progressDocs },
    { label: 'Live Classes',   value: stats.liveClasses },
    { label: 'Videos Added',   value: stats.videos },
    { label: 'Total Study',    value: stats.totalStudy },
    { label: 'Total XP Given', value: stats.totalXP },
  ] : [];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {!stats && <p className="col-span-3 text-gray-400 text-sm text-center py-8">Loading...</p>}
      {items.map((s) => (
        <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-[28px] font-bold text-black">{s.value}</p>
          <p className="text-[12px] text-gray-500 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}


// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const [title,   setTitle]   = useState('');
  const [body,    setBody]    = useState('');
  const [sending, setSending] = useState(false);
  const [result,  setResult]  = useState(null);
  const [tokenCount, setTokenCount] = useState(null);

  async function checkTokens() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const tokens = snap.docs
        .map((d) => ({ uid: d.id, token: d.data().fcmToken }))
        .filter((t) => t.token);
      
      console.log('📊 Users with FCM tokens:', tokens);
      setTokenCount(tokens.length);
      setResult({ success: true, message: `Found ${tokens.length} users with FCM tokens` });
    } catch (e) {
      console.error('Error checking tokens:', e);
      setResult({ success: false, message: e.message });
    }
  }

  async function sendToAll() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      // Get all users with FCM tokens
      const snap = await getDocs(collection(db, 'users'));
      const tokens = snap.docs
        .map((d) => d.data().fcmToken)
        .filter((t) => t);

      console.log('📊 Found FCM tokens:', tokens.length);

      if (tokens.length === 0) {
        setResult({ success: false, message: 'No users with FCM tokens found. Make sure users have logged in and allowed notifications.' });
        return;
      }

      // Send to each token
      let sent = 0;
      let failed = 0;
      const errors = [];
      
      for (const token of tokens) {
        try {
          console.log('📤 Sending to token:', token.substring(0, 20) + '...');
          
          const res = await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fcmToken: token, title, body }),
          });
          
          const data = await res.json();
          console.log('📥 Response:', data);
          
          if (data.success) {
            sent++;
            console.log('✅ Sent successfully');
          } else {
            failed++;
            console.error('❌ Failed:', data.error);
            if (data.error && !errors.includes(data.error)) {
              errors.push(data.error);
            }
          }
        } catch (e) {
          failed++;
          console.error('❌ Error sending to token:', e);
          if (!errors.includes(e.message)) {
            errors.push(e.message);
          }
        }
      }

      if (sent > 0) {
        setResult({ 
          success: true, 
          message: `✅ Sent to ${sent}/${tokens.length} users${failed > 0 ? `. ${failed} failed.` : ''}${errors.length > 0 ? `\n\nErrors: ${errors.join(', ')}` : ''}` 
        });
      } else {
        setResult({ 
          success: false, 
          message: `❌ Failed to send all notifications.\n\n${errors.length > 0 ? `Error: ${errors[0]}` : 'Check browser console for details.'}` 
        });
      }
      
      if (sent === 0) {
        // Don't clear form if all failed
        return;
      }
      
      setTitle('');
      setBody('');
    } catch (e) {
      console.error('❌ Exception:', e);
      setResult({ success: false, message: `Error: ${e.message}` });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-[14px] font-bold mb-4">📢 Send Push Notification to All Users</h2>
      <p className="text-[12px] text-gray-500 mb-4">
        Sends to all users who enabled push notifications (works even if browser is closed).
      </p>
      
      {/* Debug: Check token count */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <button
          onClick={checkTokens}
          className="bg-blue-500 text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔍 Check FCM Token Count
        </button>
        {tokenCount !== null && (
          <p className="text-[12px] text-gray-600 mt-2">
            Found {tokenCount} users with FCM tokens
          </p>
        )}
      </div>

      <div className="space-y-3">
        <input
          className={inp}
          placeholder="Notification Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={inp}
          placeholder="Notification Body *"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          onClick={sendToAll}
          disabled={sending || !title.trim() || !body.trim()}
          className="bg-black text-white text-[13px] font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {sending ? 'Sending...' : 'Send to All Users'}
        </button>
        {result && (
          <div className={`text-[12px] p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            <pre className="whitespace-pre-wrap font-sans">{result.message}</pre>
          </div>
        )}
      </div>
    </div>
  );
}


// ── API Management Tab ────────────────────────────────────────────────────────
function ApiManagementTab() {
  const DEFAULT_APIS = {
    baseUrl:        'https://apiserverpro.onrender.com/api/missionjeet',
    batches:        'https://apiserverpro.onrender.com/api/missionjeet/batches',
    courseDetails:  'https://apiserverpro.onrender.com/api/missionjeet/course-details',
    allContent:     'https://apiserverpro.onrender.com/api/missionjeet/all-content',
    contentDetails: 'https://apiserverpro.onrender.com/api/missionjeet/content-details',
  };

  const API_LABELS = {
    baseUrl:        'Base URL (proxy uses this)',
    batches:        'Batches API (course list)',
    courseDetails:  'Course Details API',
    allContent:     'All Content API (videos/folders)',
    contentDetails: 'Content Details API (video URL)',
  };

  const [config, setConfig]   = useState(DEFAULT_APIS);
  const [saved,  setSaved]    = useState(false);
  const [saving, setSaving]   = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    getDocs(collection(db, 'apiConfig')).then(snap => {
      const d = snap.docs.find(d => d.id === 'urls');
      if (d) setConfig(prev => ({ ...prev, ...d.data() }));
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const { setDoc, doc: fsDoc } = await import('firebase/firestore');
      await setDoc(fsDoc(db, 'apiConfig', 'urls'), config, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(key) {
    const url = config[key];
    if (!url) return;
    setTestResults(p => ({ ...p, [key]: 'testing...' }));
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : Array.isArray(data?.data) ? data.data.length : '?';
      setTestResults(p => ({ ...p, [key]: `✅ OK — ${count} items (${res.status})` }));
    } catch (e) {
      setTestResults(p => ({ ...p, [key]: `❌ Failed: ${e.message}` }));
    }
  }

  async function handleSync(type) {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setSyncResult(data);
    } catch (e) {
      setSyncResult({ error: e.message });
    } finally {
      setSyncing(false);
    }
  }

  async function handleReset() {
    if (!confirm('Reset all APIs to default?')) return;
    setConfig(DEFAULT_APIS);
  }

  return (
    <div className="space-y-6">
      {/* API URLs */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-bold">🔌 API Configuration</h2>
          <button onClick={handleReset} className="text-[11px] text-gray-400 hover:text-red-500 transition-colors">
            Reset to defaults
          </button>
        </div>
        <p className="text-[12px] text-gray-500 mb-4">
          Change any API URL here. Website will automatically use the new URL. No code changes needed.
        </p>

        <div className="space-y-4">
          {Object.keys(DEFAULT_APIS).map(key => (
            <div key={key}>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                {API_LABELS[key] || key}
              </label>
              <div className="flex gap-2">
                <input
                  className={inp + ' flex-1 font-mono text-[11px]'}
                  value={config[key] || ''}
                  onChange={e => setConfig(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={DEFAULT_APIS[key]}
                />
                <button
                  onClick={() => handleTest(key)}
                  className="shrink-0 px-3 py-2 text-[11px] border border-gray-200 rounded-lg hover:border-black transition-colors"
                >
                  Test
                </button>
              </div>
              {testResults[key] && (
                <p className={`text-[11px] mt-1 ${testResults[key].startsWith('✅') ? 'text-green-600' : testResults[key] === 'testing...' ? 'text-gray-400' : 'text-red-500'}`}>
                  {testResults[key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white text-[13px] font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save API Config'}
          </button>
        </div>
      </div>

      {/* Sync Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-[14px] font-bold mb-2">🔄 Data Sync</h2>
        <p className="text-[12px] text-gray-500 mb-4">
          Manually trigger a sync to fetch latest data from APIs and update Firebase. Website always reads from Firebase.
        </p>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleSync('batches')}
            disabled={syncing}
            className="bg-blue-500 text-white text-[13px] font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Syncing...' : '🔄 Sync Batches → Firebase'}
          </button>
          <button
            onClick={() => handleSync('all')}
            disabled={syncing}
            className="bg-purple-500 text-white text-[13px] font-semibold px-5 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Syncing...' : '🔄 Sync All → Firebase'}
          </button>
        </div>

        {syncResult && (
          <div className={`mt-4 p-3 rounded-lg text-[12px] ${syncResult.error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
            {syncResult.error ? (
              <p>❌ {syncResult.error}</p>
            ) : (
              <div>
                <p className="font-semibold mb-1">✅ Sync complete!</p>
                {syncResult.results?.batches && (
                  <p>Batches: {syncResult.results.batches.total} total, {syncResult.results.batches.updated} updated, {syncResult.results.batches.added} added</p>
                )}
                {syncResult.results?.batches?.note && (
                  <p className="text-yellow-600 mt-1">⚠️ {syncResult.results.batches.note}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h3 className="text-[13px] font-bold text-blue-800 mb-2">ℹ️ How it works</h3>
        <ul className="text-[12px] text-blue-700 space-y-1">
          <li>• Website reads all data from <strong>Firebase</strong> (not directly from APIs)</li>
          <li>• When you change an API URL and click Save, the new URL is stored in Firebase</li>
          <li>• Click "Sync Batches → Firebase" to fetch from new API and update Firebase</li>
          <li>• Website automatically shows updated data</li>
          <li>• Daily auto-sync runs at midnight (Vercel cron)</li>
          <li>• You can change any API anytime without touching code</li>
        </ul>
      </div>
    </div>
  );
}

'use client';

import { use, useEffect, useRef, useState } from 'react';
import { doc, setDoc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import VideoPlayer from '@/app/components/VideoPlayer';
import Link from 'next/link';

function fmt(price) {
  if (!price) return '';
  return '&#8377;' + Number(price).toLocaleString('en-IN');
}

function fmtTs(ts) {
  if (!ts) return '';
  try {
    return new Date(ts * 1000).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

// Decode HTML entities from API titles (e.g. &#127769; → 🌙)
function cleanText(text) {
  if (!text || typeof window === 'undefined') return text ?? '';
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}

function normalise(item) {
  const d = item.data ?? {};
  return {
    id:        d.id ?? item.entity_id ?? item.id,
    type:      item.type,
    title:     item.title ?? d.title ?? '',
    thumbnail: d.thumbnail ?? null,
    fileUrl:   d.file_url ?? null,
    isLocked:  d.is_locked === 1,
    duration:  d.duration ?? null,
    createdAt: d.created_at ?? null,
  };
}

// Firestore folder cache helpers
async function getCachedFolder(folderId) {
  try {
    const snap = await getDoc(doc(db, 'folders', String(folderId)));
    return snap.exists() ? snap.data().content : null;
  } catch { return null; }
}

async function cacheFolder(folderId, data) {
  try {
    await setDoc(doc(db, 'folders', String(folderId)), { content: data, updatedAt: Date.now() });
  } catch {}
}

export default function CoursePage({ params }) {
  const { slug }  = use(params);
  const courseId  = slug.split('-').pop();
  const { user, profile, setProfile } = useAuth();
  const router    = useRouter();

  const [course,       setCourse]       = useState(null);
  const [rootItems,    setRootItems]    = useState([]);   // top-level content
  const [activeTab,    setActiveTab]    = useState('content');
  const [currentVideo, setCurrentVideo] = useState(null); // { url, title, id }
  const [playerOpen,   setPlayerOpen]   = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [enrolling,    setEnrolling]    = useState(false);
  const [dark,         setDark]         = useState(false);
  const [error,        setError]        = useState(null);

  const xpTimer = useRef(null);

  const isEnrolled = profile?.enrolledCourses?.includes(Number(courseId)) ||
                     profile?.enrolledCourses?.includes(String(courseId));

  // dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // fetch course details + root content
  useEffect(() => {
    async function load() {
      try {
        // Course details
        const detailsRes = await fetch(`/api/missionjeet/course-details?courseid=${courseId}`);
        if (!detailsRes.ok) throw new Error(`Details API: ${detailsRes.status}`);
        const json     = await detailsRes.json();
        const overview = json?.data?.find((i) => i.type === 'overview');
        const details  = overview?.data?.find((i) => i.layout_type === 'details');
        const data     = details?.layout_data?.[0];
        if (!data) throw new Error('Course data not found');
        setCourse(data);
        setDoc(doc(db, 'courses', String(courseId)), {
          title: data.title ?? '', description: data.description ?? '',
          thumbnail: data.thumbnail ?? '', mrp: data.mrp ?? 0,
          price: data.offer_price ?? 0, updatedAt: Date.now(),
        }).catch(() => {});

        // Root content (check Firestore cache first)
        const cached = await getCachedFolder(`root_${courseId}`);
        if (cached) {
          setRootItems(cached.map(normalise));
        } else {
          const contentRes = await fetch(`/api/missionjeet/all-content/${courseId}`);
          if (contentRes.ok) {
            const cj = await contentRes.json();
            const raw = Array.isArray(cj?.data) ? cj.data : [];
            cacheFolder(`root_${courseId}`, raw);
            setRootItems(raw.map(normalise));
          }
        }
      } catch (err) {
        console.error(err.message);
        setError(err.message);
      }
    }
    load();
  }, [courseId]);

  // XP every 3 min while watching
  useEffect(() => {
    if (currentVideo && user) {
      xpTimer.current = setInterval(async () => {
        try {
          await updateDoc(doc(db, 'users', user.uid), { xp: increment(1) });
          setProfile((p) => p ? { ...p, xp: (p.xp ?? 0) + 1 } : p);
        } catch {}
      }, 180000);
    } else {
      clearInterval(xpTimer.current);
    }
    return () => clearInterval(xpTimer.current);
  }, [currentVideo, user]);

  // Fetch real video URL then open player
  async function play(item, isDemo) {
    if (!isDemo && !user) { router.push('/login'); return; }
    try {
      const res  = await fetch(`/api/missionjeet/content-details?content_id=${item.id}&course_id=${courseId}`);
      const json = await res.json();
      const url  = json?.file_url ?? json?.data?.file_url ?? item.fileUrl;
      if (!url) return;
      setCurrentVideo({ url, title: cleanText(item.title), id: item.id });
      setPlayerOpen(true);
    } catch (e) {
      console.error('Video URL fetch failed', e);
      // fallback to stored fileUrl
      if (item.fileUrl) {
        setCurrentVideo({ url: item.fileUrl, title: cleanText(item.title), id: item.id });
        setPlayerOpen(true);
      }
    }
  }

  async function handleEnroll() {
    if (!user) { router.push('/login'); return; }
    setEnrolling(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { enrolledCourses: arrayUnion(Number(courseId)) });
      setProfile((p) => p ? { ...p, enrolledCourses: [...(p.enrolledCourses ?? []), Number(courseId)] } : p);
      setShowCheckout(false);
    } catch (e) { console.error(e); }
    finally { setEnrolling(false); }
  }

  if (error) return (
    <div className="max-w-[1100px] mx-auto px-6 py-10 text-center">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  );

  if (!course) return (
    <div className="max-w-[1100px] mx-auto px-6 py-10">
      <div className="animate-pulse space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  );

  const offerPrice = Number(course.offer_price ?? 0);
  const mrp        = Number(course.mrp ?? 0);
  const bg   = dark ? 'bg-gray-950' : 'bg-white';
  const text = dark ? 'text-gray-100' : 'text-gray-900';
  const card = dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`${bg} ${text} min-h-screen transition-colors`}>

      {/* Fullscreen video modal */}
      {playerOpen && currentVideo && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 shrink-0">
            <p className="text-white text-[14px] font-semibold truncate pr-4">{currentVideo.title}</p>
            <button
              onClick={() => setPlayerOpen(false)}
              className="text-white text-xl hover:text-gray-300 shrink-0 w-8 h-8 flex items-center justify-center"
            >
              {'\u2715'}
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <VideoPlayer
              videoUrl={currentVideo.url}
              videoId={String(currentVideo.id)}
              courseId={String(courseId)}
              userId={user?.uid}
            />
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[380px] overflow-hidden shadow-xl">
            {course.thumbnail && (
              <img src={course.thumbnail} alt={course.title} className="w-full" style={{ height: 'auto' }} />
            )}
            <div className="p-6">
              <h2 className="text-[16px] font-bold text-black mb-4">{course.title}</h2>
              <div className="space-y-2 text-[13px] mb-5">
                <div className="flex justify-between text-gray-600">
                  <span>Original price</span>
                  <span className="line-through" dangerouslySetInnerHTML={{ __html: fmt(mrp) }} />
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span dangerouslySetInnerHTML={{ __html: '- ' + fmt(mrp - offerPrice) }} />
                </div>
                <div className="flex justify-between font-bold text-black text-[15px] border-t border-gray-100 pt-2">
                  <span>Total</span>
                  <span dangerouslySetInnerHTML={{ __html: fmt(offerPrice) }} />
                </div>
                <p className="text-[11px] text-green-600">Inclusive of GST</p>
              </div>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-black text-white text-[13px] font-semibold py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {enrolling ? 'Processing...' : 'Confirm Enroll'}
              </button>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-full mt-2 text-[12px] text-gray-400 hover:text-gray-600 py-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-6">

        {/* Breadcrumb + dark toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <Link href="/" className="hover:underline">Home</Link>
            <span>&#8250;</span>
            <span>Details</span>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className={`text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${
              dark ? 'bg-white text-black border-white' : 'border-gray-300 text-gray-600 hover:border-gray-500'
            }`}
          >
            {dark ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark'}
          </button>
        </div>

        {/* Mobile sticky bottom bar */}
        {!isEnrolled && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-lg">
            <div>
              <span className="text-[16px] font-bold text-black" dangerouslySetInnerHTML={{ __html: fmt(offerPrice) }} />
              {mrp > 0 && <span className="line-through text-gray-400 text-[12px] ml-2" dangerouslySetInnerHTML={{ __html: fmt(mrp) }} />}
            </div>
            <button
              onClick={() => user ? setShowCheckout(true) : router.push('/login')}
              className="ml-auto bg-black text-white text-[13px] font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Buy Now
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start pb-20 lg:pb-0">

          {/* LEFT */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-bold mb-4">{course.title}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-1">
              {isEnrolled ? (
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-[13px] font-semibold px-4 py-2 rounded-lg">
                  &#10003; Enrolled
                </span>
              ) : (
                <button
                  onClick={() => user ? setShowCheckout(true) : router.push('/login')}
                  className="bg-black text-white text-[13px] font-semibold px-6 py-2.5 rounded hover:bg-gray-800 transition-colors"
                >
                  Buy Now
                </button>
              )}
              <span className="text-[20px] font-bold" dangerouslySetInnerHTML={{ __html: fmt(offerPrice) }} />
              {mrp > 0 && (
                <span className="line-through text-gray-400 text-[14px]" dangerouslySetInnerHTML={{ __html: fmt(mrp) }} />
              )}
            </div>
            <p className="text-[11px] text-green-600 mb-5">Inclusive of GST</p>

            {/* Tabs */}
            <div className={`flex border-b ${dark ? 'border-gray-700' : 'border-gray-200'} mb-5`}>
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'content',  label: 'Content' },
                { key: 'demo',     label: 'Demo Lectures' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 pb-3 text-[13px] font-medium transition-colors ${
                    activeTab === key
                      ? `border-b-2 ${dark ? 'border-white text-white' : 'border-black text-black'}`
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <TabContent
              activeTab={activeTab}
              course={course}
              rootItems={rootItems}
              courseId={courseId}
              play={play}
              isEnrolled={isEnrolled}
              card={card}
            />
          </div>

          {/* RIGHT: Pricing card */}
          <div className="hidden lg:block w-[240px] shrink-0 sticky top-[80px]">
            <div className={`border rounded-xl overflow-hidden shadow-sm ${card}`}>
              {course.thumbnail && (
                <img src={course.thumbnail} alt={course.title} className="w-full" style={{ height: 'auto' }} />
              )}
              <div className="p-4">
                <p className="text-[13px] font-semibold mb-3">{course.title}</p>
                <div className={`border-t pt-3 mb-3 flex items-center gap-2 ${dark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <span className="text-[18px] font-bold" dangerouslySetInnerHTML={{ __html: fmt(offerPrice) }} />
                  {mrp > 0 && (
                    <span className="line-through text-gray-400 text-[12px]" dangerouslySetInnerHTML={{ __html: fmt(mrp) }} />
                  )}
                </div>
                {isEnrolled ? (
                  <div className="w-full bg-green-50 text-green-700 border border-green-200 text-[13px] font-semibold py-2.5 rounded-lg text-center">
                    &#10003; Enrolled
                  </div>
                ) : (
                  <button
                    onClick={() => user ? setShowCheckout(true) : router.push('/login')}
                    className="w-full bg-black text-white text-[13px] font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Buy Now
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Tab content (owns folder navigation state) ────────────────────────────────
function TabContent({ activeTab, course, rootItems, courseId, play, isEnrolled, card }) {
  // stack of { items, title } — stack[0] is always root
  const [stack, setStack] = useState([{ items: rootItems, title: 'Content' }]);

  // sync root when it loads
  useEffect(() => {
    setStack([{ items: rootItems, title: 'Content' }]);
  }, [rootItems]);

  const current = stack[stack.length - 1];

  async function openFolder(folder) {
    const cached = await getCachedFolder(folder.id);
    let raw;
    if (cached) {
      raw = cached;
    } else {
      const res  = await fetch(`/api/missionjeet/all-content/${courseId}?id=${folder.id}`);
      const json = await res.json();
      raw = Array.isArray(json?.data) ? json.data : [];
      cacheFolder(folder.id, raw);
    }
    setStack((prev) => [...prev, { items: raw.map(normalise), title: cleanText(folder.title) }]);
  }

  function goBack(index) {
    setStack((prev) => prev.slice(0, index + 1));
  }

  if (activeTab === 'overview') return (
    <div
      className="text-[13px] leading-relaxed prose max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: course.description ?? '' }}
    />
  );

  if (activeTab === 'content') return (
    <div>
      {/* Folder breadcrumb */}
      {stack.length > 1 && (
        <div className="flex items-center gap-1 flex-wrap mb-3 text-[12px] text-gray-500">
          {stack.map((s, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>&#8250;</span>}
              <button
                onClick={() => goBack(i)}
                className={i === stack.length - 1 ? 'font-semibold text-black dark:text-white' : 'hover:underline'}
              >
                {s.title}
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {current.items.map((item) =>
          item.type === 'folder' ? (
            <FolderRow key={item.id} item={item} onOpen={openFolder} card={card} />
          ) : (
            <VideoRow key={item.id} item={item} onPlay={play} isEnrolled={isEnrolled} card={card} />
          )
        )}
        {current.items.length === 0 && (
          <p className="text-gray-400 text-sm">No content available.</p>
        )}
      </div>
    </div>
  );

  if (activeTab === 'demo') {
    const demos = rootItems.filter((v) => v.type === 'file' && !v.isLocked);
    return (
      <div className="space-y-2">
        {demos.map((v) => (
          <VideoRow key={v.id} item={v} onPlay={play} forcePlayable card={card} />
        ))}
        {demos.length === 0 && (
          <p className="text-gray-400 text-sm">No demo lectures available.</p>
        )}
      </div>
    );
  }

  return null;
}

// ── Folder row ────────────────────────────────────────────────────────────────
function FolderRow({ item, onOpen, card }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    await onOpen(item);
    setLoading(false);
  }
  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:opacity-80 transition-colors ${card}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{'\uD83D\uDCC1'}</span>
        <span className="text-[13px] font-medium">{cleanText(item.title)}</span>
      </div>
      {loading
        ? <span className="text-gray-400 text-[11px]">Loading...</span>
        : <span className="text-gray-400">&#8250;</span>
      }
    </div>
  );
}

// ── Video row ─────────────────────────────────────────────────────────────────
function VideoRow({ item, onPlay, isEnrolled, forcePlayable, card }) {
  const [loading, setLoading] = useState(false);
  const canPlay = forcePlayable || isEnrolled;

  async function handleClick() {
    if (!canPlay) return;
    setLoading(true);
    await onPlay(item, forcePlayable);
    setLoading(false);
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${card} ${
        canPlay ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {item.thumbnail
          ? <img src={item.thumbnail} alt="" className="rounded-lg object-cover shrink-0 w-[60px] md:w-[80px]" style={{ height: 'auto' }} />
          : <div className="w-[60px] md:w-[80px] h-[40px] md:h-[50px] bg-gray-100 rounded-lg shrink-0 flex items-center justify-center"><span>{'\uD83C\uDFA6'}</span></div>
        }
        <div className="min-w-0">
          <p className="text-[13px] font-medium truncate">{cleanText(item.title)}</p>
          {item.createdAt && <p className="text-[11px] text-gray-400 mt-0.5">{fmtTs(item.createdAt)}</p>}
        </div>
      </div>
      <span className="ml-3 shrink-0 text-[11px] text-gray-400">
        {loading ? 'Loading...' : !canPlay ? '\uD83D\uDD12' : ''}
      </span>
    </div>
  );
}

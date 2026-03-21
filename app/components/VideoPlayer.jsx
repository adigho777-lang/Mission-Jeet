'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function getVideoType(url) {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('.m3u8')) return 'hls';
  return 'mp4';
}

function getYouTubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}

export default function VideoPlayer({ videoUrl, videoId, courseId, userId }) {
  const videoRef  = useRef(null);
  const hlsRef    = useRef(null);
  const saveTimer = useRef(null);

  const [speed,      setSpeed]      = useState(1);
  const [noteText,   setNoteText]   = useState('');
  const [notes,      setNotes]      = useState([]);
  const [showNotes,  setShowNotes]  = useState(false);
  const [levels,     setLevels]     = useState([]);   // HLS quality levels
  const [currentLvl, setCurrentLvl] = useState(-1);  // -1 = Auto

  const type = getVideoType(videoUrl);

  // ── HLS / MP4 loader ──
  useEffect(() => {
    if (type === 'youtube' || !videoRef.current || !videoUrl) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const vid = videoRef.current;

    if (type === 'hls' && Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30, enableWorker: true, startLevel: -1 });
      hls.loadSource(videoUrl);
      hls.attachMedia(vid);
      hlsRef.current = hls;

      // Populate quality levels once manifest is parsed
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const lvls = data.levels.map((l, i) => ({
          index: i,
          label: l.height ? `${l.height}p` : `Level ${i + 1}`,
          bitrate: l.bitrate,
        }));
        // Sort highest quality first
        lvls.sort((a, b) => b.bitrate - a.bitrate);
        setLevels(lvls);
        setCurrentLvl(-1); // start on Auto
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        // keep UI in sync when auto-switches
        if (hls.autoLevelEnabled) setCurrentLvl(-1);
      });
    } else {
      vid.src = videoUrl;
    }

    async function resume() {
      if (!userId || !videoId) return;
      try {
        const snap = await getDoc(doc(db, 'progress', `${userId}_${videoId}`));
        if (snap.exists() && snap.data().currentTime > 5) {
          vid.currentTime = snap.data().currentTime;
        }
      } catch {}
    }

    vid.addEventListener('loadedmetadata', resume);
    return () => {
      vid.removeEventListener('loadedmetadata', resume);
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [videoUrl, videoId, userId, type]);

  // ── Quality change handler ──
  function changeQuality(lvlIndex) {
    setCurrentLvl(lvlIndex);
    if (!hlsRef.current) return;
    if (lvlIndex === -1) {
      hlsRef.current.currentLevel    = -1;
      hlsRef.current.autoLevelEnabled = true;
    } else {
      hlsRef.current.autoLevelEnabled = false;
      hlsRef.current.currentLevel    = lvlIndex;
    }
  }

  // ── Save progress every 10s ──
  useEffect(() => {
    if (!userId || !videoId || type === 'youtube') return;
    saveTimer.current = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || vid.paused || !vid.duration) return;
      setDoc(doc(db, 'progress', `${userId}_${videoId}`), {
        videoId, courseId,
        currentTime: Math.floor(vid.currentTime),
        duration:    Math.floor(vid.duration),
        updatedAt:   Date.now(),
      }, { merge: true }).catch(() => {});
    }, 10000);
    return () => clearInterval(saveTimer.current);
  }, [userId, videoId, courseId, type]);

  // ── Load notes ──
  useEffect(() => {
    if (!userId || !videoId) return;
    getDoc(doc(db, 'notes', `${userId}_${videoId}`))
      .then((snap) => { if (snap.exists()) setNotes(snap.data().notes ?? []); })
      .catch(() => {});
  }, [userId, videoId]);

  // ── Speed ──
  useEffect(() => {
    if (videoRef.current && type !== 'youtube') videoRef.current.playbackRate = speed;
  }, [speed, type]);

  async function addNote() {
    if (!noteText.trim() || !userId || !videoId) return;
    const time = type !== 'youtube' ? Math.floor(videoRef.current?.currentTime ?? 0) : 0;
    const note = { time, text: noteText.trim() };
    const newNotes = [...notes, note];
    setNotes(newNotes);
    setNoteText('');
    try {
      await setDoc(doc(db, 'notes', `${userId}_${videoId}`), { notes: newNotes }, { merge: true });
    } catch {}
  }

  function seekTo(t) {
    if (videoRef.current && type !== 'youtube') videoRef.current.currentTime = t;
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  return (
    <div className="w-full bg-black flex flex-col h-full">

      {/* YouTube embed */}
      {type === 'youtube' && (
        <iframe
          src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full flex-1 min-h-0"
          style={{ border: 'none', minHeight: '300px', maxHeight: 'calc(100vh - 160px)' }}
        />
      )}

      {/* HLS / MP4 */}
      {type !== 'youtube' && (
        <video
          ref={videoRef}
          controls
          autoPlay
          className="w-full flex-1 min-h-0"
          style={{ display: 'block', maxHeight: 'calc(100vh - 160px)', objectFit: 'contain' }}
        />
      )}

      {/* Controls bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 flex-wrap shrink-0">

        {/* Speed — non-YouTube only */}
        {type !== 'youtube' && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-[11px]">Speed</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-gray-800 text-white text-[11px] rounded px-2 py-1 border border-gray-700 focus:outline-none"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
          </div>
        )}

        {/* Quality — HLS only */}
        {type === 'hls' && levels.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-[11px]">Quality</span>
            <select
              value={currentLvl}
              onChange={(e) => changeQuality(Number(e.target.value))}
              className="bg-gray-800 text-white text-[11px] rounded px-2 py-1 border border-gray-700 focus:outline-none"
            >
              <option value={-1}>Auto</option>
              {levels.map((l) => (
                <option key={l.index} value={l.index}>{l.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Type badge */}
        <span className="text-[10px] text-gray-500 uppercase font-mono">
          {type === 'youtube' ? '\uD83D\uDCFA YT' : type === 'hls' ? '\uD83D\uDCF6 HLS' : '\uD83C\uDFA5 MP4'}
        </span>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`ml-auto text-[11px] px-3 py-1 rounded border transition-colors ${
            showNotes ? 'bg-white text-black border-white' : 'text-gray-300 border-gray-700 hover:border-gray-500'
          }`}
        >
          {'\uD83D\uDCDD'} Notes {notes.length > 0 && `(${notes.length})`}
        </button>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div className="bg-gray-950 px-4 py-3 border-t border-gray-800 shrink-0">
          <div className="flex gap-2 mb-3">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder="Write a note at current timestamp..."
              className="flex-1 bg-gray-800 text-white text-[12px] rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-gray-500 placeholder-gray-500"
            />
            <button
              onClick={addNote}
              className="bg-white text-black text-[12px] font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
            >
              Add
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-gray-500 text-[11px]">No notes yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
              {notes.map((n, i) => (
                <div
                  key={i}
                  onClick={() => seekTo(n.time)}
                  className={`flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                    type !== 'youtube' ? 'cursor-pointer hover:bg-gray-800' : ''
                  }`}
                >
                  <span className="text-[10px] text-blue-400 font-mono shrink-0 mt-0.5">{fmtTime(n.time)}</span>
                  <span className="text-[12px] text-gray-300">{n.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

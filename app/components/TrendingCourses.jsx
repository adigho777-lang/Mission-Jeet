'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const fallbackCourses = [
  { id: '151', title: 'Drona JEE class 11th', thumbnail: '' },
  { id: '152', title: 'Drona NEET class 11th', thumbnail: '' },
];

export default function TrendingCourses() {
  const [courses, setCourses] = useState(fallbackCourses);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // ONLY Firebase — no direct API calls
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const snap = await getDocs(collection(db, 'batches'));
        const list = snap.docs.map(d => d.data()).filter(c => c.thumbnail);
        if (list.length >= 1) {
          setCourses(list.slice(0, 2).map(c => ({
            id: c.id, title: c.title, thumbnail: c.thumbnail,
          })));
        }
      } catch {}
    }
    load();
  }, []);

  // 🔥 SLUG GENERATOR
  const createSlug = (title, id) => {
    return `${title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${id}`;
  };

  return (
    <section className="py-10 px-6 bg-white">
      <div className="max-w-[1200px] mx-auto">

        {/* TITLE */}
        <h2 className="text-[18px] font-semibold text-black text-center mb-6">
          🔥 Trending Course
        </h2>

        {/* CARDS */}
        <div className="flex justify-center gap-6">

          {courses.map((c) => {
            const isActive = activeId === c.id;

            return (
              <div key={c.id} className="flex flex-col items-center">

                {/* CARD */}
                <div
                  onClick={() => setActiveId(isActive ? null : c.id)}
                  className="relative rounded-xl overflow-hidden cursor-pointer transition hover:scale-[1.03] flex items-center justify-center bg-gray-900"
                  style={{ width: '160px', height: '100px', boxShadow: '0 1px 6px rgba(0,0,0,0.12)' }}
                >
                  {c.thumbnail ? (
                    <Image src={c.thumbnail} alt={c.title} fill className="object-cover"
                      sizes="160px" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <span className="text-3xl">📚</span>
                  )}
                </div>

                {/* TITLE */}
                <p className="text-[11px] text-gray-700 mt-2 text-center w-[160px]">
                  {c.title}
                </p>

                {/* 🔥 BUTTONS */}
                {isActive && (
                  <div className="flex gap-2 mt-3 w-[160px]">

                    {/* ✅ EXPLORE (WORKING LINK) */}
                    <Link
                      href={`/private/course/${createSlug(c.title, c.id)}`}
                      className="flex-1"
                    >
                      <button className="w-full border border-black text-black text-[11px] py-1.5 rounded-md hover:bg-black hover:text-white transition">
                        Explore
                      </button>
                    </Link>

                    {/* BUY NOW */}
                    <button
                      className="flex-1 bg-black text-white text-[11px] py-1.5 rounded-md hover:opacity-90 transition"
                    >
                      Buy Now
                    </button>

                  </div>
                )}

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}
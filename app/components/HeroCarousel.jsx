'use client';
import { useState, useEffect } from 'react';

const FALLBACKS = [
  {
    bg: 'linear-gradient(135deg, #0f3460 0%, #533483 60%, #e94560 100%)',
    title: 'Crack JEE 2025 🚀',
    sub: 'Expert-led courses by Mission JEET',
  },
  {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    title: 'Crack NEET 2025 🧬',
    sub: 'India\'s best NEET preparation platform',
  },
];

export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [cur, setCur] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const snap = await getDocs(collection(db, 'batches'));
        const imgs = snap.docs.map(d => d.data().thumbnail).filter(Boolean);
        if (imgs.length > 0) setSlides(imgs);
      } catch {}
    }
    load();
  }, []);

  const total = slides.length > 0 ? slides.length : FALLBACKS.length;

  useEffect(() => {
    if (total < 2) return;
    const t = setInterval(() => setCur(p => (p + 1) % total), 3500);
    return () => clearInterval(t);
  }, [total]);

  return (
    <section className="pt-3 pb-4 px-6">
      <div className="max-w-[1180px] mx-auto">
        <div className="relative w-full rounded-xl overflow-hidden shadow-md" style={{ height: '210px' }}>

          {slides.length > 0 ? (
            slides.map((src, i) => (
              <div key={i} className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: i === cur ? 1 : 0, zIndex: i === cur ? 1 : 0 }}>
                <img src={src} alt="banner" className="w-full h-full object-cover object-center"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
            ))
          ) : (
            FALLBACKS.map((f, i) => (
              <div key={i} className="absolute inset-0 transition-opacity duration-700 flex items-center justify-center px-8"
                style={{ opacity: i === cur ? 1 : 0, zIndex: i === cur ? 1 : 0, background: f.bg }}>
                <div className="text-center text-white">
                  <p className="text-[24px] md:text-[32px] font-bold">{f.title}</p>
                  <p className="text-[13px] md:text-[15px] mt-2 opacity-80">{f.sub}</p>
                  <div className="mt-4 inline-block bg-white/20 border border-white/30 text-white text-[12px] font-semibold px-5 py-2 rounded-full">
                    Explore Courses →
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {Array.from({ length: total }).map((_, i) => (
              <button key={i} onClick={() => setCur(i)} aria-label={`Slide ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === cur ? '18px' : '6px', background: i === cur ? '#ff6a00' : 'rgba(255,255,255,0.6)' }} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

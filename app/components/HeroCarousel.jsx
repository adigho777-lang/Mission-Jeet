'use client';
import { useState, useEffect } from 'react';

// Slides loaded from Firebase batches (thumbnails from API)
// Fallback: gradient placeholders (no broken image requests)
export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [cur, setCur] = useState(0);

  useEffect(() => {
    // Load thumbnails from Firebase batches
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

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setCur((p) => (p + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, [slides]);

  const gradients = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #0f3460 0%, #533483 50%, #e94560 100%)',
  ];

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
            // Fallback gradient banners when no images available
            gradients.map((bg, i) => (
              <div key={i} className="absolute inset-0 transition-opacity duration-700 flex items-center justify-center"
                style={{ opacity: i === cur ? 1 : 0, zIndex: i === cur ? 1 : 0, background: bg }}>
                <div className="text-center text-white">
                  <p className="text-[22px] font-bold">{i === 0 ? 'Crack NEET 2025' : 'Crack JEE 2025'}</p>
                  <p className="text-[13px] mt-1 opacity-80">Expert-led courses by Mission JEET</p>
                </div>
              </div>
            ))
          )}

          {/* Dots */}
          {(slides.length > 1 || gradients.length > 1) && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {(slides.length > 0 ? slides : gradients).map((_, i) => (
                <button key={i} onClick={() => setCur(i)} aria-label={`Slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === cur ? '18px' : '6px', background: i === cur ? '#ff6a00' : 'rgba(255,255,255,0.75)' }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const slides = [
  'https://dxixtlyravvxx.cloudfront.net/1772100600/admin_v2/thumbnails//147818_131_drona%20neet%20banner%20website.jpg',
  'https://dxixtlyravvxx.cloudfront.net/1772100600/admin_v2/thumbnails//2679626_131_drona%20jee%20banner%20website.jpg',
];

export default function HeroCarousel() {
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCur((p) => (p + 1) % slides.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="pt-3 pb-4 px-6">
      <div className="max-w-[1180px] mx-auto">
        {/* Banner — height matches the screenshot aspect ratio (~5:1) */}
        <div
          className="relative w-full rounded-xl overflow-hidden shadow-md"
          style={{ height: '210px' }}
        >
          {slides.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === cur ? 1 : 0, zIndex: i === cur ? 1 : 0 }}
            >
              <Image
                src={src}
                alt="banner"
                fill
                className="object-cover object-center"
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 1180px"
              />
            </div>
          ))}

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCur(i)}
                aria-label={`Slide ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === cur ? '18px' : '6px',
                  background: i === cur ? '#ff6a00' : 'rgba(255,255,255,0.75)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

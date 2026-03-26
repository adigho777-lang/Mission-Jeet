'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function cleanText(text) {
  if (!text || typeof window === 'undefined') return text ?? '';
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}

function ProductsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const tab          = searchParams.get('tab') ?? 'jee';

  const [batches,  setBatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Read from Firebase first (API → Firebase → Website)
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const snap = await getDocs(collection(db, 'batches'));
        
        if (!snap.empty) {
          // Firebase has data — use it
          const firebaseBatches = snap.docs.map(d => d.data());
          setBatches(firebaseBatches);
          setLoading(false);
          return;
        }

        // Firebase empty — fallback to API
        const res  = await fetch('/api/missionjeet/batches');
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();

        // API: json.data[].list[] contains batch items
        let raw = [];
        if (Array.isArray(json?.data)) {
          json.data.forEach((group) => {
            if (Array.isArray(group?.list)) raw.push(...group.list);
            else if (group?.id) raw.push(group);
          });
        } else if (Array.isArray(json)) {
          raw = json;
        }

        setBatches(raw);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function setTab(t) {
    router.push(`/products?tab=${t}`, { scroll: false });
  }

  // Filter by tab — match title/category containing jee or neet
  const filtered = batches.filter((b) => {
    const haystack = `${b.title ?? ''} ${b.category ?? ''} ${b.course_type ?? ''}`.toLowerCase();
    return haystack.includes(tab);
  });

  // If API doesn't tag courses, show all
  const display = filtered.length > 0 ? filtered : batches;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1180px] mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-6">
          <Link href="/" className="hover:underline">Home</Link>
          <span>&#8250;</span>
          <span>Products</span>
        </div>

        <h1 className="text-[22px] font-bold text-black mb-5">Our Courses</h1>

        {/* JEE / NEET tabs */}
        <div className="flex gap-2 mb-6">
          {['jee', 'neet'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-lg text-[13px] font-semibold uppercase transition-colors ${
                tab === t
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* States */}
        {loading && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="animate-pulse rounded-xl overflow-hidden border border-gray-100">
                <div className="bg-gray-200 h-[180px]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center py-10">{error}</p>
        )}

        {!loading && !error && (
          <>
            {display.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">No courses found.</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {display.map((b) => (
                  <BatchCard key={b.id} batch={b} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

function BatchCard({ batch }) {
  const title      = cleanText(batch.title ?? batch.name ?? '');
  const thumbnail  = batch.thumbnail ?? batch.image ?? batch.banner ?? null;
  const mrp        = Number(batch.mrp ?? batch.price ?? 0);
  const offerPrice = Number(batch.offer_price ?? batch.final_price ?? batch.discounted_price ?? mrp);
  const slug       = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${batch.id}`;

  return (
    <Link href={`/private/course/${slug}`}>
      <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
        {/* Thumbnail */}
        <div className="relative bg-gray-100 overflow-hidden" style={{ height: '180px' }}>
          {thumbnail
            ? <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
            : <div className="w-full h-full flex items-center justify-center text-4xl">&#127979;</div>
          }
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[14px] font-semibold text-black leading-snug line-clamp-2 mb-2">{title}</p>

          <div className="flex items-center gap-2">
            {offerPrice > 0 ? (
              <>
                <span className="text-[15px] font-bold text-black">
                  &#8377;{offerPrice.toLocaleString('en-IN')}
                </span>
                {mrp > offerPrice && (
                  <span className="text-[12px] text-gray-400 line-through">
                    &#8377;{mrp.toLocaleString('en-IN')}
                  </span>
                )}
              </>
            ) : (
              <span className="text-[13px] text-green-600 font-semibold">Free</span>
            )}
          </div>

          <button className="mt-3 w-full bg-black text-white text-[12px] font-semibold py-2 rounded-lg hover:bg-gray-800 transition-colors">
            View Course
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

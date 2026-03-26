'use client';
import Image from 'next/image';
import Link from 'next/link';

const products = [
  {
    id: 'jee',
    label: 'JEE',
    src: 'https://dxixtlyravvxx.cloudfront.net/1772100600/admin_v2/thumbnails//2889397_1_JEE%20Icon09.jpg.jpeg',
  },
  {
    id: 'neet',
    label: 'NEET',
    src: 'https://dxixtlyravvxx.cloudfront.net/1772100600/admin_v2/thumbnails//3142799_1_NEET%20Icon09.jpg.jpeg',
  },
];

export default function ProductCards() {
  return (
    <section id="products" className="py-8 px-6 bg-white">
      <div className="max-w-[1180px] mx-auto">
        <h2 className="text-[18px] font-bold text-black text-center mb-5">Our Product</h2>

        <div className="flex gap-5 justify-center flex-wrap">
          {products.map((p) => (
            <Link key={p.id} href={`/products?tab=${p.id}`}>
              <div
                className="relative rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
                style={{ width: '220px', height: '220px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                <Image
                  src={p.src}
                  alt={p.label}
                  fill
                  className="object-cover"
                  sizes="220px"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5"
                  style={{ background: 'rgba(0,0,0,0.45)' }}
                >
                  <span className="text-white text-[12px] font-semibold">{p.label}</span>
                  <span className="text-white text-[12px] font-bold">&#8250;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

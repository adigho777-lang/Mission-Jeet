'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#0a0f1c', color: '#9ca3af' }}>
      
      <div className="max-w-[1200px] mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">

        <div>
          <img
            src="https://decicqog4ulhy.cloudfront.net/0/admin_v2/uploads/courses/thumbnail/7524245_1_WhatsApp%20Image%202026-03-02%20at%204.19.45%20PM.jpeg"
            alt="Mission JEET"
            style={{ width: '120px', height: 'auto' }}
            className="mb-3 object-contain"
          />
          <p className="text-[12px] leading-relaxed mb-4">
            Mission JEET is a dedicated ed-tech platform helping students crack JEE &amp; NEET with expert-led courses, live classes, and test series.
          </p>
          <ul className="text-[12px] space-y-1">
            <li>📍 Bhavnagar, Gujarat, India</li>
            <li>📞 +91-XXXXXXXXXX</li>
            <li>✉️ support@missionjeet.in</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-[13px] font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-[12px]">
            <li><Link href="#" className="hover:text-[#ff6a00]">About Us</Link></li>
            <li><Link href="#" className="hover:text-[#ff6a00]">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-[13px] font-semibold mb-4">Products</h4>
          <ul className="space-y-2 text-[12px]">
            <li><Link href="/products?tab=jee" className="hover:text-[#ff6a00]">JEE</Link></li>
            <li><Link href="/products?tab=neet" className="hover:text-[#ff6a00]">NEET</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-[13px] font-semibold mb-4">Help &amp; Support</h4>
          <ul className="space-y-2 text-[12px]">
            <li><Link href="#" className="hover:text-[#ff6a00]">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-[#ff6a00]">Terms of Service</Link></li>
          </ul>
        </div>

      </div>

      <div className="border-t text-center text-[11px] py-4" style={{ borderColor: '#1f2937', color: '#6b7280' }}>
        © {new Date().getFullYear()} Mission JEET. All Rights Reserved.
      </div>

    </footer>
  );
}

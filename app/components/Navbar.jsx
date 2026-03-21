'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const { user, profile } = useAuth();

  async function logout() {
    await signOut(auth);
    setUserMenu(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black">

      {/* TOP ROW — utility links */}
      <div className="border-b border-gray-800">
        <div className="max-w-[1320px] mx-auto px-6 h-[28px] hidden lg:flex items-center justify-end gap-5">
          <Link href="#" className="flex items-center gap-1.5 text-gray-300 text-[11px] hover:text-white transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Download App
          </Link>
          <span className="text-gray-700 text-[11px]">|</span>
          <Link href="#" className="flex items-center gap-1.5 text-gray-300 text-[11px] hover:text-white transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help &amp; Support
          </Link>
        </div>
      </div>

      {/* BOTTOM ROW — main nav */}
      <div className="max-w-[1320px] mx-auto px-6 h-[44px] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="https://decicqog4ulhy.cloudfront.net/0/admin_v2/uploads/courses/thumbnail/7524245_1_WhatsApp%20Image%202026-03-02%20at%204.19.45%20PM.jpeg"
            alt="Mission JEET"
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
        </Link>

        {/* Search — desktop */}
        <div className="hidden lg:flex flex-1 justify-center max-w-[320px]">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="What are you looking for..."
              className="w-full h-[30px] rounded-full text-[11px] px-4 pr-9 focus:outline-none"
              style={{ background: '#2a2a2a', color: '#ccc', border: '1px solid #3a3a3a' }}
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </div>

        {/* Right nav — desktop */}
        <div className="hidden lg:flex items-center gap-5 shrink-0">
          <Link href="/leaderboard" className="text-white text-[13px] font-medium hover:text-gray-300 transition-colors">
            Leaderboard
          </Link>
          <Link href="/live-classes" className="text-white text-[13px] font-medium hover:text-gray-300 transition-colors">
            Live Classes
          </Link>
          <Link href="#" className="text-white text-[13px] font-medium hover:text-gray-300 transition-colors">
            Blogs
          </Link>
          <button className="flex items-center gap-1 text-white text-[13px] font-medium hover:text-gray-300 transition-colors">
            Our Products
            <svg className="w-3 h-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded transition-colors whitespace-nowrap"
                style={{ background: '#fff', color: '#111' }}
              >
                <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                  {(profile?.name ?? user.email ?? 'U')[0].toUpperCase()}
                </span>
                {profile?.name?.split(' ')[0] ?? 'Account'}
              </button>
              {userMenu && (
                <div className="absolute right-0 top-full mt-1 w-[160px] bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                  <p className="px-4 py-2 text-[11px] text-gray-400 truncate">{user.email}</p>
                  {profile?.xp !== undefined && (
                    <p className="px-4 py-1 text-[11px] text-gray-600">{profile.xp} XP</p>
                  )}
                  <hr className="border-gray-100 my-1" />
                  <button onClick={logout} className="w-full text-left px-4 py-2 text-[12px] text-red-500 hover:bg-gray-50">
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[12px] font-semibold px-4 py-1.5 rounded transition-colors whitespace-nowrap"
              style={{ background: '#fff', color: '#111', border: '1px solid #ccc' }}
            >
              Login / Register
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden text-white p-1" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden bg-black border-t border-gray-800 px-6 py-4 flex flex-col gap-3">
          <input
            type="text"
            placeholder="What are you looking for..."
            className="w-full h-[30px] rounded-full text-[11px] px-4 focus:outline-none"
            style={{ background: '#2a2a2a', color: '#ccc', border: '1px solid #3a3a3a' }}
          />
          <Link href="#" className="text-white text-xs" onClick={() => setOpen(false)}>Download App</Link>
          <Link href="#" className="text-white text-xs" onClick={() => setOpen(false)}>Help &amp; Support</Link>
          <Link href="#" className="text-white text-xs" onClick={() => setOpen(false)}>Blogs</Link>
          <Link href="/live-classes" className="text-white text-xs" onClick={() => setOpen(false)}>Live Classes</Link>
          <Link href="/leaderboard" className="text-white text-xs" onClick={() => setOpen(false)}>Leaderboard</Link>
          <Link href="#products" className="text-white text-xs" onClick={() => setOpen(false)}>Our Products</Link>
          <Link
            href="#"
            className="text-xs font-semibold px-4 py-2 rounded text-center"
            style={{ background: '#fff', color: '#111' }}
            onClick={() => setOpen(false)}
          >
            Login / Register
          </Link>
        </div>
      )}
    </header>
  );
}

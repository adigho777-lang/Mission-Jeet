'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tg_popup_dismissed';

export default function TelegramPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show after 3s, only if not dismissed before
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] w-[280px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#229ED9] px-4 py-3 flex items-center gap-3">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.978.892z"/>
        </svg>
        <div>
          <p className="text-white text-[13px] font-bold">Join our Telegram</p>
          <p className="text-blue-100 text-[11px]">Free batches &amp; updates</p>
        </div>
        <button onClick={dismiss} className="ml-auto text-white/70 hover:text-white text-lg leading-none">{'\u2715'}</button>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <p className="text-[12px] text-gray-600 mb-4">
          Get free study material, live class alerts, and batch updates directly on Telegram.
        </p>
        <a
          href="https://t.me/missiontopper_freebatches"
          target="_blank"
          rel="noreferrer"
          onClick={dismiss}
          className="block w-full bg-[#229ED9] text-white text-[13px] font-semibold py-2.5 rounded-xl text-center hover:bg-[#1a8bbf] transition-colors"
        >
          Join Channel
        </a>
        <button
          onClick={dismiss}
          className="w-full mt-2 text-[11px] text-gray-400 hover:text-gray-600 py-1"
        >
          Already joined
        </button>
      </div>
    </div>
  );
}

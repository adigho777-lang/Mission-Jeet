'use client';

import { useState } from 'react';

export default function CourseSidebar({ subjects, currentVideoId, onSelectVideo }) {
  const [openSubjects, setOpenSubjects] = useState({ 0: true });
  const [openChapters, setOpenChapters] = useState({ '0-0': true });

  function toggleSubject(i) {
    setOpenSubjects((p) => ({ ...p, [i]: !p[i] }));
  }

  function toggleChapter(key) {
    setOpenChapters((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="h-full overflow-y-auto">
      {subjects.map((subject, si) => (
        <div key={si} className="border-b border-gray-100 last:border-0">
          {/* Subject header */}
          <button
            onClick={() => toggleSubject(si)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <span className="text-[13px] font-bold text-gray-800">{subject.name}</span>
            <span className="text-gray-400 text-xs">{openSubjects[si] ? '\u25BC' : '\u25B6'}</span>
          </button>

          {openSubjects[si] && (
            <div>
              {subject.chapters.map((chapter, ci) => {
                const key = `${si}-${ci}`;
                return (
                  <div key={ci}>
                    {/* Chapter header */}
                    <button
                      onClick={() => toggleChapter(key)}
                      className="w-full flex items-center justify-between px-5 py-2.5 bg-white hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                    >
                      <span className="text-[12px] font-semibold text-gray-700">{chapter.name}</span>
                      <span className="text-gray-300 text-xs">{openChapters[key] ? '\u25BC' : '\u25B6'}</span>
                    </button>

                    {openChapters[key] && (
                      <div>
                        {chapter.videos.map((video) => {
                          const isActive = currentVideoId === video.id;
                          return (
                            <button
                              key={video.id}
                              onClick={() => !video.isLocked && onSelectVideo(video)}
                              disabled={video.isLocked}
                              className={`w-full flex items-center gap-2 px-6 py-2.5 text-left transition-colors border-t border-gray-50
                                ${isActive ? 'bg-black text-white' : 'bg-white hover:bg-gray-50 text-gray-700'}
                                ${video.isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                              `}
                            >
                              <span className="text-xs shrink-0">
                                {video.isLocked ? '\uD83D\uDD12' : isActive ? '\u25B6\uFE0F' : '\uD83C\uDFA6'}
                              </span>
                              <span className="text-[12px] flex-1 truncate">{video.title}</span>
                              {video.isDemo && (
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded shrink-0">
                                  Demo
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

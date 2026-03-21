'use client';

import { useState } from 'react';

export default function CourseContent({ course, content, demoVideos }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [openFolders, setOpenFolders] = useState({});

  function toggleFolder(id) {
    setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'content', label: 'Content' },
          { key: 'demo', label: 'Demo Lectures' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 text-[14px] font-medium transition-colors ${
              activeTab === key
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div
          className="text-[13px] text-gray-700 leading-relaxed prose max-w-none"
          dangerouslySetInnerHTML={{ __html: course?.description || '<p>No description available.</p>' }}
        />
      )}

      {/* Content */}
      {activeTab === 'content' && (
        <div className="space-y-2">
          {content.length === 0 && (
            <p className="text-gray-400 text-sm">No content available.</p>
          )}
          {content.map((item, i) => {
            const isFolder = item.content_type === 'folder' || !item.file_url;
            const isOpen = openFolders[item.id];

            if (isFolder) {
              return (
                <div key={item.id ?? i} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFolder(item.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">\uD83D\uDCC1</span>
                      <span className="text-[13px] font-semibold text-gray-800">{item.title ?? item.name}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{isOpen ? '\u25BC' : '\u25B6'}</span>
                  </button>
                  {isOpen && item.children?.length > 0 && (
                    <div className="divide-y divide-gray-100">
                      {item.children.map((child, j) => (
                        <LockedItem key={child.id ?? j} item={child} />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return <LockedItem key={item.id ?? i} item={item} />;
          })}
        </div>
      )}

      {/* Demo Lectures */}
      {activeTab === 'demo' && (
        <div className="space-y-3">
          {demoVideos.length === 0 && (
            <p className="text-gray-400 text-sm">No demo lectures available.</p>
          )}
          {demoVideos.map((video, i) => (
            <div
              key={video.id ?? i}
              className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  style={{ width: '120px', height: 'auto' }}
                  className="rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-[120px] h-[68px] bg-gray-200 rounded shrink-0 flex items-center justify-center">
                  <span className="text-2xl">\u25B6\uFE0F</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 truncate">{video.title}</p>
                {video.date && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{video.date}</p>
                )}
              </div>
              {video.file_url && (
                <button
                  onClick={() => window.open(video.file_url, '_blank')}
                  className="shrink-0 bg-black text-white text-[12px] font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Play \u25B6
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LockedItem({ item }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg">
      <div className="flex items-center gap-3">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            style={{ width: '80px', height: 'auto' }}
            className="rounded object-cover"
          />
        ) : (
          <div className="w-[80px] h-[45px] bg-gray-100 rounded flex items-center justify-center shrink-0">
            <span className="text-lg">\uD83D\uDCCB</span>
          </div>
        )}
        <div>
          <p className="text-[13px] font-medium text-gray-800">{item.title ?? item.name}</p>
          {item.date && <p className="text-[11px] text-gray-400 mt-0.5">{item.date}</p>}
        </div>
      </div>
      <span className="text-gray-400 text-lg">\uD83D\uDD12</span>
    </div>
  );
}

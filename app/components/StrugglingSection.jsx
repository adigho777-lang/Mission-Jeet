'use client';

export default function StrugglingSection() {
  return (
    <section className="py-4 px-6 bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div
          className="flex items-center justify-between rounded-xl px-5 py-3"
          style={{ background: '#eaf7f4', border: '1px solid #cdeee6' }}
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">📚</div>
            <div>
              <p className="text-[14px] font-semibold text-[#1a1a1a]">Struggling in Studies?</p>
              <p className="text-[12px] text-gray-600 mt-1">Aaiye apki Samasya ka Samadhan krte hai ✨</p>
            </div>
          </div>
          <button
            className="text-white text-[12px] font-medium px-5 py-2 rounded-md"
            style={{ background: '#10b981' }}
          >
            See How We Help
          </button>
        </div>
      </div>
    </section>
  );
}
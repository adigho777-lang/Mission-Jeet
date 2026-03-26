'use client';

const stats = [
  { value: '20+',  label: 'Instructors', bg: '#fef9c3', border: '#fde68a', color: '#92400e', icon: '👨‍🏫' },
  { value: '20K+', label: 'Videos',      bg: '#e0f2fe', border: '#bae6fd', color: '#1d4ed8', icon: '🎥' },
  { value: '20L+', label: 'Students',    bg: '#dcfce7', border: '#bbf7d0', color: '#15803d', icon: '🎓' },
  { value: '200+', label: 'Test Series', bg: '#f3e8ff', border: '#e9d5ff', color: '#7e22ce', icon: '📝' },
];

export default function AchievementsSection() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center">

        {/* LEFT — no external image, use stats visual instead */}
        <div className="flex justify-center md:justify-start">
          <div className="grid grid-cols-2 gap-3 max-w-[320px] w-full">
            {stats.map((s) => (
              <div key={s.label + '-mini'}
                className="rounded-xl px-3 py-3 flex flex-col items-center text-center"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div>
          <h2 className="text-[26px] font-semibold text-[#1a1a1a]">Our Achievements</h2>
          <p className="text-[13px] text-gray-500 mt-2 leading-relaxed max-w-[420px]">
            We are proud of the milestones achieved through innovative courses and student-first dedication to providing high-quality education and learning growth.
          </p>
          <div className="mt-6 space-y-3">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <span className="text-[18px] font-bold" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[13px] text-gray-600 ml-2">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
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

        {/* LEFT IMAGE */}
        <div className="flex justify-center md:justify-start">
          <img
            src="https://missionjeet.in/images/Nexttopper_achivement.png"
            alt="Achievements"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            style={{ width: '100%', height: 'auto', maxWidth: '480px' }}
            className="object-contain"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div>
          {/* TITLE */}
          <h2 className="text-[26px] font-semibold text-[#1a1a1a]">
            Our Achievements
          </h2>

          {/* DESCRIPTION */}
          <p className="text-[13px] text-gray-500 mt-2 leading-relaxed max-w-[420px]">
            We are proud of the milestones achieved through innovative courses and student-first dedication to providing high-quality education and learning growth.
          </p>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-4 mt-6">

            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-4 py-4 flex flex-col items-center justify-center text-center"
                style={{
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  minHeight: '100px',
                }}
              >
                {/* ICON */}
                <div className="text-[20px] mb-1">{s.icon}</div>

                {/* VALUE */}
                <p
                  className="text-[20px] font-bold leading-tight"
                  style={{ color: s.color }}
                >
                  {s.value}
                </p>

                {/* LABEL */}
                <p className="text-[12px] text-gray-700 mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
}
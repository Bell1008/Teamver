"use client";

const ACCENT = "#2563eb";

export default function SettingsTab({ profile }) {
  return (
    <div className="p-6 h-full overflow-y-auto page-water">
      <h2 className="text-lg font-bold text-gray-900 mb-6">설정</h2>

      <div className="max-w-md space-y-4">
        {/* 계정 정보 */}
        <section className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 16px rgba(37,99,235,0.05)" }}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">계정 정보</h3>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 flex items-center justify-center text-lg font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`,
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                boxShadow: `0 4px 14px rgba(37,99,235,0.35)`,
              }}
            >
              {profile?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile?.username}</p>
              <p className="text-xs text-gray-400 mt-0.5">Teamver 계정</p>
            </div>
          </div>
        </section>

        {/* 테마 안내 */}
        <section className="rounded-2xl p-5" style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.12)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2C12 2 7 7.5 7 11.5C7 14.54 9.24 17 12 17C14.76 17 17 14.54 17 11.5C17 7.5 12 2 12 2Z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">물방울 블루 테마</p>
              <p className="text-xs text-gray-400 mt-0.5">화이트 & 블루 고정 테마가 적용되어 있습니다.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

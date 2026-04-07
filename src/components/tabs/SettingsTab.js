"use client";

const ACCENT = "#2563eb";

export default function SettingsTab() {
  return (
    <div className="p-6 h-full overflow-y-auto page-water">
      <h2 className="text-lg font-bold text-gray-900 mb-6">설정</h2>

      <div className="max-w-md space-y-4">
        {/* 테마 */}
        <section className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 16px rgba(37,99,235,0.05)" }}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">테마</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(37,99,235,0.1)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">물방울 블루</p>
              <p className="text-xs text-gray-400 mt-0.5">화이트 & 블루 고정 테마</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium text-blue-600" style={{ backgroundColor: "rgba(37,99,235,0.1)" }}>적용 중</span>
          </div>
        </section>

        {/* 알림 (준비 중) */}
        <section className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 16px rgba(37,99,235,0.05)" }}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">알림 설정</h3>
          <p className="text-sm text-gray-400">준비 중입니다.</p>
        </section>
      </div>
    </div>
  );
}

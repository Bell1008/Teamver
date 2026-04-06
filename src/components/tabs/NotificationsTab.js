"use client";

export default function NotificationsTab({ accentColor }) {
  return (
    <div className="p-6 h-full flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
        </div>
        <h2 className="text-base font-semibold text-gray-700 mb-1">알림</h2>
        <p className="text-sm text-gray-400">준비 중입니다.</p>
      </div>
    </div>
  );
}

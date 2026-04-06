"use client";

import { useState } from "react";
import { updateTheme } from "@/lib/auth";

export default function SettingsTab({ userId, profile, onThemeUpdate }) {
  const [bg, setBg] = useState(profile?.theme_bg ?? "#ffffff");
  const [accent, setAccent] = useState(profile?.theme_accent ?? "#2563eb");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTheme(userId, bg, accent);
      onThemeUpdate(bg, accent);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">설정</h2>

      <div className="max-w-md space-y-6">
        {/* 계정 정보 */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">계정 정보</h3>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {profile?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-medium text-gray-900">{profile?.username}</p>
              <p className="text-xs text-gray-400">아이디</p>
            </div>
          </div>
        </section>

        {/* 테마 설정 */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">테마 색상</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">배경색</p>
                <p className="text-xs text-gray-400">전체 화면 배경</p>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg border border-gray-300"
                  style={{ backgroundColor: bg }}
                />
                <input
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">강조색</p>
                <p className="text-xs text-gray-400">버튼·아이콘 등 포인트 색</p>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg border border-gray-300"
                  style={{ backgroundColor: accent }}
                />
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 미리보기 */}
          <div className="mt-4 rounded-lg p-3 border border-gray-100" style={{ backgroundColor: bg }}>
            <p className="text-xs text-gray-400 mb-2">미리보기</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ backgroundColor: accent }}
              >
                버튼 예시
              </button>
              <span className="text-xs font-medium" style={{ color: accent }}>강조 텍스트</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: accent }}
          >
            {saving ? "저장 중..." : saved ? "저장됨!" : "저장"}
          </button>
        </section>
      </div>
    </div>
  );
}

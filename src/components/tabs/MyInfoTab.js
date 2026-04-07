"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useDialog } from "@/components/DialogProvider";

const ACCENT = "#2563eb";

export default function MyInfoTab({ profile, userId, onProfileUpdate }) {
  const dialog = useDialog();
  const [editing, setEditing]   = useState(false);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    const trimmed = username.trim();
    if (!trimmed) { await dialog.alert("이름을 입력해주세요."); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", userId);
    setSaving(false);
    if (error) { await dialog.alert("저장 실패: " + error.message, { type: "error" }); return; }
    setEditing(false);
    onProfileUpdate?.({ ...profile, username: trimmed });
  };

  const initial = (profile?.username ?? "?")[0].toUpperCase();

  return (
    <div className="p-6 h-full overflow-y-auto page-water">
      <h2 className="text-lg font-bold text-gray-900 mb-6">내 정보</h2>

      <div className="max-w-md space-y-4">
        {/* 아바타 + 기본 정보 */}
        <section className="bg-white rounded-2xl p-6" style={{ border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 16px rgba(37,99,235,0.05)" }}>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 flex items-center justify-center text-2xl font-black text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", boxShadow: `0 4px 14px rgba(37,99,235,0.35)` }}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-base">{profile?.username}</p>
              <p className="text-xs text-gray-400 mt-0.5">Teamver 계정</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* 닉네임 */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">닉네임 (아이디)</p>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 text-sm rounded-xl border outline-none"
                    style={{ borderColor: `rgba(37,99,235,0.25)`, backgroundColor: "#f8faff" }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
                    autoFocus
                    maxLength={30}
                  />
                  <button onClick={handleSave} disabled={saving}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
                    {saving ? "저장 중..." : "저장"}
                  </button>
                  <button onClick={() => { setEditing(false); setUsername(profile?.username ?? ""); }}
                    className="px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "#f8faff", border: "1px solid rgba(37,99,235,0.08)" }}>
                  <span className="text-sm text-gray-800 font-medium">{profile?.username}</span>
                  <button onClick={() => setEditing(true)}
                    className="text-xs font-medium hover:underline" style={{ color: ACCENT }}>
                    수정
                  </button>
                </div>
              )}
            </div>

            {/* 계정 ID (UUID 일부 표시) */}
            {userId && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">계정 ID</p>
                <div className="px-3 py-2 rounded-xl" style={{ backgroundColor: "#f8faff", border: "1px solid rgba(37,99,235,0.08)" }}>
                  <span className="text-xs text-gray-500 font-mono">{userId.slice(0, 8)}···</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 서비스 정보 */}
        <section className="rounded-2xl p-4" style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.1)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(37,99,235,0.12)" }}>
              <svg width="16" height="16" viewBox="0 0 12 14" fill="none">
                <path d="M6 1C6 1 2 5.5 2 8.5C2 10.99 3.79 13 6 13C8.21 13 10 10.99 10 8.5C10 5.5 6 1 6 1Z" fill={ACCENT}/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">Teamver</p>
              <p className="text-xs text-gray-400 mt-0.5">학생 팀플 전용 AI 협업 도구</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

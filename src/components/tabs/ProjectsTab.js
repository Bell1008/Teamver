"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProjects } from "@/lib/auth";

function durationLabel(v, u) {
  if (!u) return "기한 없음";
  return `${v}${{ hours: "시간", days: "일", weeks: "주", months: "달", years: "년" }[u] ?? ""}`;
}

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const EnterIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);

export default function ProjectsTab({ userId, accentColor }) {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    getUserProjects(userId).then((list) => { setProjects(list); setLoading(false); });
  }, [userId]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinError("");
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const res = await fetch(`/api/join/${trimmed}`);
    if (!res.ok) { setJoinError("유효하지 않은 코드입니다."); return; }
    router.push(`/join/${trimmed}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">내 팀플</h2>
        <span className="text-xs text-gray-400">{projects.length}개</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* 기존 프로젝트 카드 */}
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => router.push(`/projects/${p.id}`)}
            className="card-drop aspect-square rounded-2xl border p-4 text-left flex flex-col justify-between group"
            style={{
              backgroundColor: "#fff",
              border: "1.5px solid rgba(0,0,0,0.07)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div className="overflow-hidden">
              <div
                className="w-6 h-7 rounded-lg mb-3 flex-shrink-0"
                style={{
                  background: `linear-gradient(145deg, ${accentColor}40, ${accentColor}15)`,
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                }}
              />
              <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                {p.title}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">{p.subject}</p>
            </div>
            <p
              className="text-xs font-medium mt-2"
              style={{ color: `${accentColor}90` }}
            >
              {durationLabel(p.duration_value, p.duration_unit)}
            </p>
          </button>
        ))}

        {/* 만들기 카드 */}
        <button
          onClick={() => router.push("/projects/new")}
          className="card-drop aspect-square rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 group transition-all"
          style={{ borderColor: `${accentColor}30` }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${accentColor}70`;
            e.currentTarget.style.backgroundColor = `${accentColor}06`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${accentColor}30`;
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
            style={{ color: `${accentColor}70`, backgroundColor: `${accentColor}10` }}
          >
            <PlusIcon />
          </div>
          <span className="text-xs font-medium" style={{ color: `${accentColor}80` }}>만들기</span>
        </button>

        {/* 참여하기 카드 */}
        <div
          className="card-drop aspect-square rounded-2xl border-2 border-dashed p-3 flex flex-col items-center justify-center"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full h-full flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 text-gray-400 group-hover:text-gray-600 bg-gray-50 group-hover:bg-gray-100">
                <EnterIcon />
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600">참여하기</span>
            </button>
          ) : (
            <form onSubmit={handleJoin} className="w-full flex flex-col gap-1.5">
              <input
                className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs font-mono uppercase tracking-widest text-center focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": accentColor }}
                placeholder="코드 6자리"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value); setJoinError(""); }}
                autoFocus
              />
              {joinError && <p className="text-red-500 text-xs text-center">{joinError}</p>}
              <button
                type="submit"
                className="btn-jelly w-full text-xs text-white py-1.5 rounded-xl font-medium"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
              >
                참여
              </button>
              <button
                type="button"
                onClick={() => { setShowJoin(false); setCode(""); setJoinError(""); }}
                className="text-xs text-gray-400 hover:text-gray-600 py-0.5"
              >
                취소
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserProjects } from "@/lib/auth";

function durationLabel(v, u) {
  if (!u) return "기한 없음";
  return `${v}${{ hours: "시간", days: "일", weeks: "주", months: "달", years: "년" }[u] ?? ""}`;
}

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

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">불러오는 중...</p></div>;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">내 팀플</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* 기존 프로젝트 카드들 */}
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => router.push(`/projects/${p.id}`)}
            className="aspect-square rounded-2xl border-2 border-gray-200 p-4 text-left hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <p className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600">{p.title}</p>
              <p className="text-xs text-gray-400 mt-1">{p.subject}</p>
            </div>
            <p className="text-xs text-gray-300">{durationLabel(p.duration_value, p.duration_unit)}</p>
          </button>
        ))}

        {/* 만들기 */}
        <button
          onClick={() => router.push("/projects/new")}
          className="aspect-square rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          style={{ borderColor: `${accentColor}60` }}
        >
          <span className="text-3xl text-gray-300 group-hover:text-blue-400">+</span>
          <span className="text-xs font-medium text-gray-400 group-hover:text-blue-500">만들기</span>
        </button>

        {/* 참여하기 */}
        <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2">
          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full h-full flex flex-col items-center justify-center gap-2 hover:text-blue-500 transition-colors"
            >
              <span className="text-3xl text-gray-300">↗</span>
              <span className="text-xs font-medium text-gray-400">참여하기</span>
            </button>
          ) : (
            <form onSubmit={handleJoin} className="w-full flex flex-col gap-2">
              <input
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono uppercase tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="코드 6자리"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value); setJoinError(""); }}
                autoFocus
              />
              {joinError && <p className="text-red-500 text-xs text-center">{joinError}</p>}
              <button type="submit" className="w-full text-xs text-white py-1.5 rounded-lg font-medium" style={{ backgroundColor: accentColor }}>
                참여
              </button>
              <button type="button" onClick={() => setShowJoin(false)} className="text-xs text-gray-400 hover:text-gray-600">취소</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

const UNIT_OPTIONS = [
  { value: "hours",  label: "시간" },
  { value: "days",   label: "일" },
  { value: "weeks",  label: "주" },
  { value: "months", label: "달" },
  { value: "years",  label: "년" },
  { value: null,     label: "기한 없음" },
];
const VALUE_OPTIONS = {
  hours:  [1,2,3,4,6,8,12,24,48],
  days:   [1,2,3,4,5,6,7,10,14],
  weeks:  [1,2,3,4,5,6,8,10,12,16,20,24],
  months: [1,2,3,4,5,6,9,12],
  years:  [1,2,3,5],
};

const ACCENT = "#2563eb";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [project, setProject]       = useState({ title: "", goal: "", subject: "" });
  const [durationUnit, setDuration] = useState("weeks");
  const [durationValue, setDurVal]  = useState(4);
  const [userId, setUserId]         = useState(null);

  useEffect(() => {
    getSession().then((s) => { if (!s) router.replace("/"); else setUserId(s.user.id); });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!project.title || !project.goal || !project.subject) { setError("모든 항목을 입력해주세요."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...project, duration_value: durationUnit ? Number(durationValue) : null, duration_unit: durationUnit, owner_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(`owner_${data.id}`, data.owner_code);
      router.push(`/projects/${data.id}/setup`);
    } catch (err) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-water flex items-center justify-center px-4 py-12 relative">
      {/* 물방울 배경 데코 */}
      <div className="fixed top-8 right-12 pointer-events-none opacity-10" aria-hidden>
        <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
          <path d="M60 5C60 5 10 55 10 90C10 118 32 138 60 138C88 138 110 118 110 90C110 55 60 5 60 5Z" fill={ACCENT}/>
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        <button onClick={() => router.push("/home")} className="btn-jelly flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 mb-6 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          마이페이지
        </button>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-11 flex items-center justify-center"
              style={{ background: `linear-gradient(145deg, ${ACCENT}, #1d4ed8)`, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", boxShadow: `0 6px 20px rgba(37,99,235,0.35)` }}>
              <svg width="16" height="18" viewBox="0 0 12 14" fill="none"><path d="M6 1C6 1 2 5.5 2 8.5C2 10.99 3.79 13 6 13C8.21 13 10 10.99 10 8.5C10 5.5 6 1 6 1Z" fill="white"/></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">팀플 만들기</h1>
              <p className="text-xs text-gray-400 mt-0.5">만들면 초대 코드가 생성됩니다</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-5" style={{ border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 8px 40px rgba(37,99,235,0.08)" }}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">프로젝트 이름</label>
            <input className="input-drop w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm" placeholder="예: 캠퍼스 중고거래 앱" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">프로젝트 목표</label>
            <textarea className="input-drop w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm" rows={2} placeholder="한 줄로 설명해주세요" value={project.goal} onChange={(e) => setProject({ ...project, goal: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">과목 / 카테고리</label>
            <input className="input-drop w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm" placeholder="예: 모바일 프로그래밍, 해커톤" value={project.subject} onChange={(e) => setProject({ ...project, subject: e.target.value })} />
          </div>

          {/* 기간 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">프로젝트 기간</label>
            <div className="flex gap-1.5 flex-wrap mb-2.5">
              {UNIT_OPTIONS.map((opt) => (
                <button key={String(opt.value)} type="button"
                  onClick={() => { setDuration(opt.value); if (opt.value && VALUE_OPTIONS[opt.value]) setDurVal(VALUE_OPTIONS[opt.value][0]); }}
                  className="btn-jelly px-3 py-1.5 rounded-xl text-xs border transition-all"
                  style={durationUnit === opt.value
                    ? { background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, color: "white", borderColor: "transparent", boxShadow: `0 3px 10px rgba(37,99,235,0.3)` }
                    : { backgroundColor: "#f8faff", color: "#6b7280", borderColor: "rgba(37,99,235,0.12)" }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {durationUnit && (
              <select className="input-drop w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm bg-white" value={durationValue} onChange={(e) => setDurVal(e.target.value)}>
                {(VALUE_OPTIONS[durationUnit] ?? []).map((v) => (
                  <option key={v} value={v}>{v} {{ hours:"시간",days:"일",weeks:"주",months:"달",years:"년" }[durationUnit]}</option>
                ))}
              </select>
            )}
            {!durationUnit && <p className="text-xs text-blue-400 mt-1">기한 없이 진행합니다.</p>}
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <button type="submit" disabled={loading} className="btn-jelly drop-btn w-full py-3 rounded-xl text-sm disabled:opacity-50">
            {loading ? "생성 중..." : "팀플 만들기"}
          </button>
        </form>
      </div>
    </main>
  );
}

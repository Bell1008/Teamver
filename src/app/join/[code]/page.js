"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

const DEFAULT_SKILLS = [
  "React","Vue","Next.js","Node.js","Python","Java","Spring","DB 설계",
  "UI/UX 디자인","기획/PM","데이터 분석","문서화","Flutter","Swift",
  "Kotlin","TypeScript","Go","C++","DevOps","Figma",
];
const ACCENT = "#2563eb";

export default function JoinPage() {
  const { code } = useParams();
  const router = useRouter();
  const [project, setProject]       = useState(null);
  const [loadError, setLoadError]   = useState("");
  const [form, setForm]             = useState({ name: "", skills: [], personality: "" });
  const [skillInput, setSkillInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [userId, setUserId]         = useState(null);

  useEffect(() => {
    getSession().then((s) => {
      if (!s) router.replace(`/?redirect=/join/${code}`);
      else setUserId(s.user.id);
    });
    fetch(`/api/join/${code}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setLoadError(d.error); else setProject(d); })
      .catch(() => setLoadError("프로젝트를 불러오지 못했습니다."));
  }, [code, router]);

  const addSkill = (s) => {
    const trimmed = s.trim();
    if (!trimmed) return;
    if (!form.skills.includes(trimmed)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setSkillInput("");
  };

  const removeSkill = (s) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((x) => x !== s) }));
  };

  const suggestions = DEFAULT_SKILLS.filter(
    (s) => !form.skills.includes(s) &&
      (skillInput === "" || s.toLowerCase().includes(skillInput.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.name.trim()) { setSubmitError("이름을 입력해주세요."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/join/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(`member_${project.id}`, data.member_code);
      localStorage.setItem(`member_name_${project.id}`, data.name);
      localStorage.setItem(`member_id_${project.id}`, data.id);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setSubmitError(err.message || "참여 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return (
    <main className="page-water flex items-center justify-center">
      <p className="text-red-500">{loadError}</p>
    </main>
  );
  if (!project) return (
    <main className="page-water flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </main>
  );

  return (
    <main className="page-water flex items-center justify-center px-4 py-12 relative">
      {/* 데코 */}
      <div className="fixed bottom-8 left-8 pointer-events-none opacity-8" aria-hidden>
        <svg width="80" height="92" viewBox="0 0 80 92" fill="none">
          <path d="M40 3C40 3 6 37 6 60C6 78 21 92 40 92C59 92 74 78 74 60C74 37 40 3 40 3Z" fill={ACCENT}/>
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* 프로젝트 정보 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
              팀플 초대
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{project.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{project.subject}</p>
          <p className="text-sm text-gray-600 mt-2">{project.goal}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-5"
          style={{ border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 8px 40px rgba(37,99,235,0.08)" }}>

          {/* 이름 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">이름</label>
            <input
              className="input-drop w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm"
              placeholder="본명 또는 닉네임"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* 스킬 — 검색 + 직접 입력 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">보유 스킬</label>

            {/* 선택된 태그 */}
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.skills.map((s) => (
                  <span key={s}
                    className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
                    {s}
                    <button type="button" onClick={() => removeSkill(s)}
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 검색/직접 입력 */}
            <input
              className="input-drop w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm mb-2"
              placeholder="스킬 검색 또는 직접 입력 후 Enter…"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); }
              }}
            />

            {/* 추천 칩 */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => addSkill(s)}
                    className="btn-jelly px-2.5 py-1 rounded-full text-xs border transition-all"
                    style={{ borderColor: "rgba(37,99,235,0.15)", color: "#4b6bda", backgroundColor: "rgba(37,99,235,0.04)" }}>
                    + {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI 참고 메모 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">AI 참고 메모</label>
            <p className="text-xs text-gray-400 mb-2">역할, 특기, 관심사, 기여 가능한 일 등을 적어주세요. AI 킥오프 시 역할 배분에 참고합니다.</p>
            <textarea
              className="input-drop w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm resize-none"
              placeholder={"예) 백엔드 개발이 특기이고 DB 설계 경험이 있습니다.\n팀 내 문서화와 일정 관리도 맡고 싶습니다."}
              rows={3}
              value={form.personality}
              onChange={(e) => setForm({ ...form, personality: e.target.value })}
            />
          </div>

          {submitError && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{submitError}</p>
          )}

          <button type="submit" disabled={submitting}
            className="btn-jelly drop-btn w-full py-3 rounded-xl text-sm disabled:opacity-50">
            {submitting ? "참여 중..." : "팀플 참여하기"}
          </button>
        </form>
      </div>
    </main>
  );
}

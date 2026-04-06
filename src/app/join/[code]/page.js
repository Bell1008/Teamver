"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

const SKILLS = ["React","Vue","Next.js","Node.js","Python","Java","Spring","DB 설계","UI/UX 디자인","기획/PM","데이터 분석","문서화"];
const PERSONALITIES = ["꼼꼼하고 완성도를 중시","논리적이고 문서화를 잘함","창의적이고 아이디어가 많음","리더십이 강하고 추진력 있음","협력적이고 팀워크를 중시"];
const ACCENT = "#2563eb";

export default function JoinPage() {
  const { code } = useParams();
  const router = useRouter();
  const [project, setProject]     = useState(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm]           = useState({ name: "", skills: [], personality: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [userId, setUserId]       = useState(null);

  useEffect(() => {
    getSession().then((s) => { if (!s) router.replace(`/?redirect=/join/${code}`); else setUserId(s.user.id); });
    fetch(`/api/join/${code}`).then((r) => r.json()).then((d) => { if (d.error) setLoadError(d.error); else setProject(d); })
      .catch(() => setLoadError("프로젝트를 불러오지 못했습니다."));
  }, [code, router]);

  const toggleSkill = (skill) => setForm((prev) => ({
    ...prev,
    skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!form.name.trim()) { setSubmitError("이름을 입력해주세요."); return; }
    if (!form.personality) { setSubmitError("성향을 선택해주세요."); return; }
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

  if (loadError) return <main className="page-water flex items-center justify-center"><p className="text-red-500">{loadError}</p></main>;
  if (!project)  return <main className="page-water flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></main>;

  return (
    <main className="page-water flex items-center justify-center px-4 py-12 relative">
      {/* 데코 */}
      <div className="fixed bottom-8 left-8 pointer-events-none opacity-8" aria-hidden>
        <svg width="80" height="92" viewBox="0 0 80 92" fill="none"><path d="M40 3C40 3 6 37 6 60C6 78 21 92 40 92C59 92 74 78 74 60C74 37 40 3 40 3Z" fill={ACCENT}/></svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* 프로젝트 정보 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>팀플 초대</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{project.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{project.subject}</p>
          <p className="text-sm text-gray-600 mt-2">{project.goal}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-5" style={{ border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 8px 40px rgba(37,99,235,0.08)" }}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">이름</label>
            <input className="input-drop w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm" placeholder="본명 또는 닉네임" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">보유 스킬</label>
            <div className="flex flex-wrap gap-1.5">
              {SKILLS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSkill(s)}
                  className="btn-jelly px-2.5 py-1 rounded-full text-xs border transition-all"
                  style={form.skills.includes(s)
                    ? { background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, color: "white", borderColor: "transparent" }
                    : { backgroundColor: "#f8faff", color: "#6b7280", borderColor: "rgba(37,99,235,0.12)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">나의 성향</label>
            <div className="space-y-2">
              {PERSONALITIES.map((p) => (
                <label key={p} className="flex items-center gap-3 cursor-pointer group py-1">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    style={form.personality === p ? { borderColor: ACCENT, backgroundColor: ACCENT } : { borderColor: "rgba(37,99,235,0.2)" }}
                    onClick={() => setForm({ ...form, personality: p })}>
                    {form.personality === p && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900" onClick={() => setForm({ ...form, personality: p })}>{p}</span>
                </label>
              ))}
            </div>
          </div>

          {submitError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{submitError}</p>}

          <button type="submit" disabled={submitting} className="btn-jelly drop-btn w-full py-3 rounded-xl text-sm disabled:opacity-50">
            {submitting ? "참여 중..." : "팀플 참여하기"}
          </button>
        </form>
      </div>
    </main>
  );
}

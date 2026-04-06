"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

const SKILLS = ["React","Vue","Next.js","Node.js","Python","Java","Spring","DB 설계","UI/UX 디자인","기획/PM","데이터 분석","문서화"];
const PERSONALITIES = ["꼼꼼하고 완성도를 중시","논리적이고 문서화를 잘함","창의적이고 아이디어가 많음","리더십이 강하고 추진력 있음","협력적이고 팀워크를 중시"];
const ACCENT = "#2563eb";

export default function OwnerSetupPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [form, setForm]       = useState({ name: "", skills: [], personality: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState("");
  const [userId, setUserId]   = useState(null);

  useEffect(() => {
    getSession().then((s) => { if (!s) router.replace("/"); else setUserId(s.user.id); });
    fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => { if (!d.error) setProject(d.project); });
  }, [id, router]);

  const toggleSkill = (skill) => setForm((prev) => ({
    ...prev,
    skills: prev.skills.includes(skill) ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!form.personality) { setError("성향을 선택해주세요."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/join/${project.invite_code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem(`member_${id}`, data.member_code);
      localStorage.setItem(`member_name_${id}`, data.name);
      localStorage.setItem(`member_id_${id}`, data.id);
      router.push(`/projects/${id}`);
    } catch (err) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!project) return <main className="page-water flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></main>;

  return (
    <main className="page-water flex items-center justify-center px-4 py-12 relative">
      <div className="w-full max-w-md relative z-10">
        <div className="mb-8">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white inline-block mb-3" style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>팀플 생성 완료</span>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{project.subject}</p>
          <p className="text-sm text-gray-400 mt-2">내 정보를 입력해 팀원으로 등록합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 space-y-5" style={{ border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 8px 40px rgba(37,99,235,0.08)" }}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">이름</label>
            <input autoFocus className="input-drop w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm" placeholder="본명 또는 닉네임" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-jelly drop-btn w-full py-3 rounded-xl text-sm disabled:opacity-50">
            {submitting ? "저장 중..." : "참여 완료 — 대시보드로 이동"}
          </button>
        </form>
      </div>
    </main>
  );
}

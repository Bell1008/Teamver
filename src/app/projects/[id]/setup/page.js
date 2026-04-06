"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

const SKILLS = ["React", "Vue", "Next.js", "Node.js", "Python", "Java", "Spring", "DB 설계", "UI/UX 디자인", "기획/PM", "데이터 분석", "문서화"];
const PERSONALITIES = ["꼼꼼하고 완성도를 중시", "논리적이고 문서화를 잘함", "창의적이고 아이디어가 많음", "리더십이 강하고 추진력 있음", "협력적이고 팀워크를 중시"];

export default function OwnerSetupPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({ name: "", skills: [], personality: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) { router.replace("/"); return; }
      setUserId(session.user.id);
    });

    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setProject(d.project); });
  }, [id, router]);

  const toggleSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!form.personality) { setError("성향을 선택해주세요."); return; }

    setSubmitting(true);
    try {
      // invite_code로 참여 API 호출 (방장도 동일하게 멤버로 등록)
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

  if (!project) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-xs text-blue-600 font-medium mb-1">팀플 생성 완료 — 내 정보 입력</p>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{project.subject}</p>
          <p className="text-sm text-gray-600 mt-2">{project.goal}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="본명 또는 닉네임"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">보유 스킬 (복수 선택)</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSkill(s)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    form.skills.includes(s)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">나의 성향</label>
            <div className="space-y-2">
              {PERSONALITIES.map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="personality"
                    value={p}
                    checked={form.personality === p}
                    onChange={() => setForm({ ...form, personality: p })}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{p}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "저장 중..." : "참여 완료 — 대시보드로 이동"}
          </button>
        </form>
      </div>
    </main>
  );
}

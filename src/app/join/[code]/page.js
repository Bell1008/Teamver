"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const SKILLS = ["React", "Vue", "Next.js", "Node.js", "Python", "Java", "Spring", "DB 설계", "UI/UX 디자인", "기획/PM", "데이터 분석", "문서화"];
const PERSONALITIES = ["꼼꼼하고 완성도를 중시", "논리적이고 문서화를 잘함", "창의적이고 아이디어가 많음", "리더십이 강하고 추진력 있음", "협력적이고 팀워크를 중시"];

export default function JoinPage() {
  const { code } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ name: "", skills: [], personality: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch(`/api/join/${code}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setLoadError(d.error); return; }
        setProject(d);
      })
      .catch(() => setLoadError("프로젝트를 불러오지 못했습니다."));
  }, [code]);

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
    setSubmitError("");
    if (!form.name.trim()) { setSubmitError("이름을 입력해주세요."); return; }
    if (!form.personality) { setSubmitError("성향을 선택해주세요."); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/join/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // member_code 저장 (본인 기여 입력 시 식별용)
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
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">{loadError}</p>
    </main>
  );

  if (!project) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-xs text-blue-600 font-medium mb-1">팀플 초대</p>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{project.subject} · {project.duration_weeks}주</p>
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

          {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "참여 중..." : "팀플 참여하기"}
          </button>
        </form>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [project, setProject] = useState({ title: "", goal: "", subject: "", duration_weeks: 4 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!project.title || !project.goal || !project.subject) {
      setError("모든 항목을 입력해주세요."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...project, duration_weeks: Number(project.duration_weeks) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // owner_code를 localStorage에 저장 (방장 식별용)
      localStorage.setItem(`owner_${data.id}`, data.owner_code);
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-1">새 팀플 만들기</h1>
        <p className="text-sm text-gray-500 mb-8">프로젝트를 만들면 초대 코드가 생성됩니다.<br />팀원들은 코드로 직접 참여해요.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 이름</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 캠퍼스 중고거래 앱"
              value={project.title}
              onChange={(e) => setProject({ ...project, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 목표</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="한 줄로 설명해주세요"
              rows={2}
              value={project.goal}
              onChange={(e) => setProject({ ...project, goal: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">과목명</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 모바일 프로그래밍"
              value={project.subject}
              onChange={(e) => setProject({ ...project, subject: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 기간</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={project.duration_weeks}
              onChange={(e) => setProject({ ...project, duration_weeks: e.target.value })}
            >
              {[2, 3, 4, 6, 8, 12, 16].map((w) => (
                <option key={w} value={w}>{w}주</option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "생성 중..." : "팀플 만들기"}
          </button>
        </form>
      </div>
    </main>
  );
}

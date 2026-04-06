"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const UNIT_OPTIONS = [
  { value: "hours",  label: "시간" },
  { value: "days",   label: "일" },
  { value: "weeks",  label: "주" },
  { value: "months", label: "달" },
  { value: "years",  label: "년" },
  { value: null,     label: "기한 없음" },
];

const VALUE_OPTIONS = {
  hours:  [1, 2, 3, 4, 6, 8, 12, 24, 48],
  days:   [1, 2, 3, 4, 5, 6, 7, 10, 14],
  weeks:  [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24],
  months: [1, 2, 3, 4, 5, 6, 9, 12],
  years:  [1, 2, 3, 5],
};

function formatDuration(value, unit) {
  if (!unit) return "기한 없음";
  const labels = { hours: "시간", days: "일", weeks: "주", months: "달", years: "년" };
  return `${value}${labels[unit]}`;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [project, setProject] = useState({ title: "", goal: "", subject: "" });
  const [durationUnit, setDurationUnit] = useState("weeks");
  const [durationValue, setDurationValue] = useState(4);

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
        body: JSON.stringify({
          ...project,
          duration_value: durationUnit ? Number(durationValue) : null,
          duration_unit: durationUnit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
        <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          ← 돌아가기
        </button>
        <h1 className="text-2xl font-bold mb-1">팀플 만들기</h1>
        <p className="text-sm text-gray-500 mb-8">만들면 초대 코드가 생성됩니다. 팀원들은 코드로 직접 참여해요.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">과목명 / 카테고리</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 모바일 프로그래밍, 해커톤, 사이드 프로젝트"
              value={project.subject}
              onChange={(e) => setProject({ ...project, subject: e.target.value })}
            />
          </div>

          {/* 기간 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">프로젝트 기간</label>

            {/* 단위 선택 */}
            <div className="flex gap-2 flex-wrap mb-3">
              {UNIT_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    setDurationUnit(opt.value);
                    if (opt.value && VALUE_OPTIONS[opt.value]) setDurationValue(VALUE_OPTIONS[opt.value][0]);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    durationUnit === opt.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 값 선택 (기한 없음이면 숨김) */}
            {durationUnit && (
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                >
                  {(VALUE_OPTIONS[durationUnit] ?? []).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {{ hours: "시간", days: "일", weeks: "주", months: "달", years: "년" }[durationUnit]}
                </span>
              </div>
            )}

            {/* 선택된 기간 요약 */}
            <p className="text-xs text-blue-600 mt-2 font-medium">
              설정된 기간: {formatDuration(durationValue, durationUnit)}
            </p>
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

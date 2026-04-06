"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function KickoffResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">AI 설계 결과를 불러오는 중...</p>
    </main>
  );

  if (error) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">{error}</p>
    </main>
  );

  const { project, members, milestones } = data;
  const humanMembers = members.filter((m) => !m.is_ai);
  const aiMembers = members.filter((m) => m.is_ai);

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <p className="text-sm text-blue-600 font-medium mb-1">AI 킥오프 설계 완료</p>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{project.subject} · {project.duration_weeks}주 프로젝트</p>
        </div>

        {/* 역할 배정 */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">역할 배정</h2>
          <div className="space-y-3">
            {humanMembers.map((m) => (
              <div key={m.id} className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {m.name[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{m.name} <span className="text-gray-400">·</span> <span className="text-blue-600 text-sm">{m.role}</span></p>
                  <ul className="mt-1 space-y-0.5">
                    {(m.responsibilities ?? []).map((r, i) => (
                      <li key={i} className="text-xs text-gray-500">• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            {aiMembers.map((m) => (
              <div key={m.id} className="flex gap-3 items-start opacity-70">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  AI
                </div>
                <div>
                  <p className="font-medium text-sm">{m.name} <span className="text-gray-400">·</span> <span className="text-purple-600 text-sm">{m.role}</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">AI 팀원</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 마일스톤 */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">주차별 마일스톤</h2>
          <div className="space-y-4">
            {milestones.map((ms) => (
              <div key={ms.id} className="border-l-2 border-blue-200 pl-4">
                <p className="font-medium text-sm text-gray-800">{ms.week}주차 — {ms.title}</p>
                <ul className="mt-1.5 space-y-0.5">
                  {(ms.tasks ?? []).map((t, i) => (
                    <li key={i} className="text-xs text-gray-500">• {t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={() => router.push(`/projects/${id}`)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          대시보드로 이동
        </button>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ContributionForm from "@/components/ContributionForm";
import WeeklyReviewButton from "@/components/WeeklyReviewButton";

export default function ProjectDashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Supabase 실시간 구독 — contribution_logs 변경 시 새로고침
    const channel = supabase
      .channel(`project-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "contribution_logs", filter: `project_id=eq.${id}` }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id]);

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></main>;
  if (error) return <main className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></main>;

  const { project, members, milestones } = data;
  const currentWeek = getCurrentWeek(project.created_at, project.duration_weeks);
  const currentMilestone = milestones.find((ms) => ms.week === currentWeek) ?? milestones[0];
  const totalTasks = milestones.reduce((sum, ms) => sum + (ms.tasks?.length ?? 0), 0);
  const daysLeft = getDaysLeft(project.created_at, project.duration_weeks);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">{project.title}</h1>
            <p className="text-xs text-gray-400">{project.subject}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">D-{daysLeft}</p>
            <p className="text-xs text-gray-400">마감까지</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* 목표 카드 */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-1">프로젝트 목표</p>
          <p className="text-gray-800 font-medium">{project.goal}</p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{currentWeek}주차 진행 중</span>
              <span>총 {project.duration_weeks}주</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((currentWeek / project.duration_weeks) * 100, 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* 이번 주 마일스톤 */}
        {currentMilestone && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800">{currentMilestone.week}주차 마일스톤</h2>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{currentMilestone.title}</span>
            </div>
            <ul className="space-y-2">
              {(currentMilestone.tasks ?? []).map((task, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 w-4 h-4 rounded border border-gray-300 flex-shrink-0" />
                  {task}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 팀원 역할 카드 */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">팀원 역할</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((m) => (
              <div key={m.id} className={`rounded-lg p-3 ${m.is_ai ? "bg-purple-50 border border-purple-100" : "bg-blue-50 border border-blue-100"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${m.is_ai ? "bg-purple-200 text-purple-700" : "bg-blue-200 text-blue-700"}`}>
                    {m.is_ai ? "AI" : m.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 기여 입력 */}
        <ContributionForm projectId={id} members={members.filter((m) => !m.is_ai)} onSubmit={fetchData} />

        {/* 주간 리뷰 */}
        <WeeklyReviewButton projectId={id} currentWeek={currentWeek} />
      </div>
    </main>
  );
}

function getCurrentWeek(createdAt, durationWeeks) {
  const start = new Date(createdAt);
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7)) + 1;
  return Math.min(Math.max(diff, 1), durationWeeks);
}

function getDaysLeft(createdAt, durationWeeks) {
  const end = new Date(createdAt);
  end.setDate(end.getDate() + durationWeeks * 7);
  const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

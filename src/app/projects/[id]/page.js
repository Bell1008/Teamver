"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSession, getProfile } from "@/lib/auth";
import ContributionForm from "@/components/ContributionForm";
import WeeklyReviewButton from "@/components/WeeklyReviewButton";

export default function ProjectDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [myMemberId, setMyMemberId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [kickoffLoading, setKickoffLoading] = useState(false);
  const [kickoffDone, setKickoffDone] = useState(false);
  const [theme, setTheme] = useState({ bg: "#ffffff", accent: "#2563eb" });
  const [userId, setUserId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setKickoffDone(json.milestones?.length > 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // 로그인 상태 + 테마 로드
    getSession().then(async (session) => {
      if (session) {
        setUserId(session.user.id);
        const profile = await getProfile(session.user.id);
        if (profile) setTheme({ bg: profile.theme_bg ?? "#ffffff", accent: profile.theme_accent ?? "#2563eb" });
      }
    });
  }, []);

  useEffect(() => {
    fetchData();
    // 방장/멤버 식별
    setIsOwner(!!localStorage.getItem(`owner_${id}`));
    setMyMemberId(localStorage.getItem(`member_id_${id}`));

    const channel = supabase
      .channel(`project-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "contribution_logs", filter: `project_id=eq.${id}` }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `project_id=eq.${id}` }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id, fetchData]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKickoff = async () => {
    setKickoffLoading(true);
    try {
      const res = await fetch("/api/kickoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetchData();
      setKickoffDone(true);
    } catch (e) {
      alert("킥오프 실패: " + e.message);
    } finally {
      setKickoffLoading(false);
    }
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></main>;
  if (error) return <main className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></main>;

  const { project, members, milestones } = data;
  const humanMembers = members.filter((m) => !m.is_ai);
  const currentWeek = getCurrentWeek(project.created_at, project.duration_value, project.duration_unit);
  const currentMilestone = milestones.find((ms) => ms.week === currentWeek) ?? milestones[0];
  const daysLeft = getDaysLeft(project.created_at, project.duration_value, project.duration_unit);
  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${project.invite_code}`;

  return (
    <main className="min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* 헤더 */}
      <header className="border-b border-gray-200 px-6 py-4" style={{ backgroundColor: theme.bg }}>
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <button onClick={() => router.push("/home")} className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">← 마이페이지</button>
            <h1 className="text-lg font-bold">{project.title}</h1>
            <p className="text-xs text-gray-400">{project.subject} · {formatDuration(project.duration_value, project.duration_unit)}</p>
          </div>
          <div className="text-right">
            {daysLeft === null ? (
              <p className="text-sm font-medium text-gray-400">기한 없음</p>
            ) : (
              <>
                <p className="text-2xl font-bold" style={{ color: theme.accent }}>
                  D-{daysLeft}
                </p>
                <p className="text-xs text-gray-400">마감까지</p>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* 초대 코드 / 킥오프 섹션 (방장 전용) */}
        {isOwner && (
          <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">팀원 초대</h2>
              <span className="text-xs text-gray-400">{humanMembers.length}명 참여 중</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2.5">
                <p className="text-xs text-gray-400 mb-0.5">초대 코드</p>
                <p className="font-mono font-bold text-lg tracking-widest" style={{ color: theme.accent }}>{project.invite_code}</p>
              </div>
              <button
                onClick={() => handleCopy(inviteUrl)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: theme.accent }}
              >
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>

            {!kickoffDone ? (
              <button
                onClick={handleKickoff}
                disabled={kickoffLoading || humanMembers.length === 0}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: theme.accent }}
              >
                {kickoffLoading ? "AI 역할 설계 중... (10~20초)" : `AI 킥오프 실행 (${humanMembers.length}명)`}
              </button>
            ) : (
              <p className="text-sm text-green-600 font-medium text-center">킥오프 완료 — 역할 및 마일스톤이 설계되었습니다.</p>
            )}
          </section>
        )}

        {/* 팀원이 볼 초대 코드 입력 섹션 */}
        {!isOwner && !myMemberId && (
          <section className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-700 font-medium">초대 링크로 접속하셨나요?</p>
            <p className="text-xs text-blue-500 mt-1">초대 링크 → 참여하기를 완료해야 기여를 입력할 수 있어요.</p>
          </section>
        )}

        {/* 목표 카드 */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 mb-1">프로젝트 목표</p>
          <p className="text-gray-800 font-medium">{project.goal}</p>
          {kickoffDone && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{currentWeek}주차 진행 중</span>
                <span>총 {project.duration_weeks}주</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((currentWeek / project.duration_weeks) * 100, 100)}%`, backgroundColor: theme.accent }}
                />
              </div>
            </div>
          )}
        </section>

        {/* 팀원 역할 카드 */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">팀원 {humanMembers.length > 0 ? `(${humanMembers.length}명)` : ""}</h2>
          {humanMembers.length === 0 ? (
            <p className="text-sm text-gray-400">아직 참여한 팀원이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {humanMembers.map((m) => (
                <div key={m.id} className="rounded-lg p-3 border" style={{ borderColor: `${theme.accent}30`, backgroundColor: `${theme.accent}08` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: theme.accent }}>
                      {m.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.role ?? "역할 미배정"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 이번 주 마일스톤 */}
        {kickoffDone && currentMilestone && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800">{currentMilestone.week}주차 마일스톤</h2>
              <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.accent }}>{currentMilestone.title}</span>
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

        {/* 기여 입력 */}
        {kickoffDone && (myMemberId || isOwner) && (
          <ContributionForm
            projectId={id}
            members={humanMembers}
            myMemberId={myMemberId}
            accentColor={theme.accent}
            onSubmit={fetchData}
          />
        )}

        {/* 주간 리뷰 */}
        {kickoffDone && isOwner && (
          <WeeklyReviewButton projectId={id} currentWeek={currentWeek} accentColor={theme.accent} />
        )}

      </div>
    </main>
  );
}

function getDeadline(createdAt, duration_value, duration_unit) {
  if (!duration_unit || !duration_value) return null;
  const start = new Date(createdAt);
  const ms = {
    hours:  duration_value * 60 * 60 * 1000,
    days:   duration_value * 24 * 60 * 60 * 1000,
    weeks:  duration_value * 7 * 24 * 60 * 60 * 1000,
    months: duration_value * 30.44 * 24 * 60 * 60 * 1000,
    years:  duration_value * 365.25 * 24 * 60 * 60 * 1000,
  }[duration_unit] ?? 0;
  return new Date(start.getTime() + ms);
}

function getDaysLeft(createdAt, duration_value, duration_unit) {
  const deadline = getDeadline(createdAt, duration_value, duration_unit);
  if (!deadline) return null; // 기한 없음
  const diff = deadline - new Date();
  if (duration_unit === "hours") return Math.max(Math.ceil(diff / (60 * 60 * 1000)), 0) + "h";
  return Math.max(Math.ceil(diff / (24 * 60 * 60 * 1000)), 0);
}

function getCurrentWeek(createdAt, duration_value, duration_unit) {
  const totalWeeks = duration_unit === "weeks" ? duration_value
    : duration_unit === "months" ? Math.ceil(duration_value * 4.33)
    : duration_unit === "years"  ? Math.ceil(duration_value * 52)
    : duration_unit === "days"   ? Math.ceil(duration_value / 7)
    : 1;
  const diff = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24 * 7)) + 1;
  return Math.min(Math.max(diff, 1), totalWeeks || 1);
}

function formatDuration(value, unit) {
  if (!unit) return "기한 없음";
  return `${value}${{ hours: "시간", days: "일", weeks: "주", months: "달", years: "년" }[unit] ?? ""}`;
}

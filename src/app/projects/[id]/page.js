"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSession, getProfile } from "@/lib/auth";
import ContributionForm from "@/components/ContributionForm";
import WeeklyReviewButton from "@/components/WeeklyReviewButton";

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

  // 프로젝트 수정 상태
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const openEdit = () => {
    const p = data.project;
    setEditForm({
      title: p.title,
      goal: p.goal,
      subject: p.subject,
      duration_unit: p.duration_unit ?? null,
      duration_value: p.duration_value ?? 4,
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const duration_weeks = !editForm.duration_unit ? 0
        : editForm.duration_unit === "hours"  ? Math.ceil(editForm.duration_value / 168)
        : editForm.duration_unit === "days"   ? Math.ceil(editForm.duration_value / 7)
        : editForm.duration_unit === "weeks"  ? editForm.duration_value
        : editForm.duration_unit === "months" ? Math.ceil(editForm.duration_value * 4.33)
        : editForm.duration_unit === "years"  ? Math.ceil(editForm.duration_value * 52)
        : 0;

      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          goal: editForm.goal,
          subject: editForm.subject,
          duration_unit: editForm.duration_unit,
          duration_value: editForm.duration_unit ? Number(editForm.duration_value) : null,
          duration_weeks,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      await fetchData();
      setEditing(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
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
      {/* 수정 모달 */}
      {editing && editForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">프로젝트 정보 수정</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 이름</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 목표</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={editForm.goal}
                onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">과목명 / 카테고리</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">프로젝트 기간</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {UNIT_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        duration_unit: opt.value,
                        duration_value: opt.value && VALUE_OPTIONS[opt.value] ? VALUE_OPTIONS[opt.value][0] : null,
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${
                      editForm.duration_unit === opt.value
                        ? "text-white border-transparent"
                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                    }`}
                    style={editForm.duration_unit === opt.value ? { backgroundColor: theme.accent } : {}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {editForm.duration_unit && (
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={editForm.duration_value}
                  onChange={(e) => setEditForm({ ...editForm, duration_value: e.target.value })}
                >
                  {(VALUE_OPTIONS[editForm.duration_unit] ?? []).map((v) => (
                    <option key={v} value={v}>{v} {{ hours: "시간", days: "일", weeks: "주", months: "달", years: "년" }[editForm.duration_unit]}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: theme.accent }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="border-b border-gray-200 px-6 py-4" style={{ backgroundColor: theme.bg }}>
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <button onClick={() => router.push("/home")} className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">← 마이페이지</button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{project.title}</h1>
              {isOwner && (
                <button
                  onClick={openEdit}
                  className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-1.5 py-0.5"
                >
                  수정
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">{project.subject} · {formatDuration(project.duration_value, project.duration_unit)}</p>
          </div>
          <div className="text-right">
            {daysLeft === null ? (
              <p className="text-sm font-medium text-gray-400">기한 없음</p>
            ) : (
              <>
                <p className="text-2xl font-bold" style={{ color: theme.accent }}>D-{daysLeft}</p>
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
  if (!deadline) return null;
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

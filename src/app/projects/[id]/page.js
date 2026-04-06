"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSession, getProfile } from "@/lib/auth";
import ContributionForm from "@/components/ContributionForm";
import WeeklyReviewButton from "@/components/WeeklyReviewButton";
import ChatPanel from "@/components/ChatPanel";

const SKILLS = ["React","Vue","Next.js","Node.js","Python","Java","Spring","DB 설계","UI/UX 디자인","기획/PM","데이터 분석","문서화"];
const PERSONALITIES = ["꼼꼼하고 완성도를 중시","논리적이고 문서화를 잘함","창의적이고 아이디어가 많음","리더십이 강하고 추진력 있음","협력적이고 팀워크를 중시"];

const UNIT_OPTIONS = [
  { value: "hours", label: "시간" },
  { value: "days",  label: "일" },
  { value: "weeks", label: "주" },
  { value: "months",label: "달" },
  { value: "years", label: "년" },
  { value: null,    label: "기한 없음" },
];
const VALUE_OPTIONS = {
  hours:  [1,2,3,4,6,8,12,24,48],
  days:   [1,2,3,4,5,6,7,10,14],
  weeks:  [1,2,3,4,5,6,8,10,12,16,20,24],
  months: [1,2,3,4,5,6,9,12],
  years:  [1,2,3,5],
};

export default function ProjectDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const prevMemberCount = useRef(0);

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [isOwner, setIsOwner]     = useState(false);
  const [myMemberId, setMyMemberId] = useState(null);
  const [copied, setCopied]       = useState(false);
  const [kickoffLoading, setKickoffLoading] = useState(false);
  const [kickoffDone, setKickoffDone]       = useState(false);
  const [theme, setTheme]         = useState({ bg: "#ffffff", accent: "#2563eb" });

  // 채팅 패널
  const [chatOpen, setChatOpen]   = useState(false);

  // 토스트 알림
  const [toast, setToast]         = useState(null);

  // 프로젝트 수정 모달
  const [editing, setEditing]     = useState(false);
  const [editForm, setEditForm]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);

  // 프로필 수정 모달
  const [profileEdit, setProfileEdit]   = useState(null); // member 객체
  const [profileForm, setProfileForm]   = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData((prev) => {
        const newCount = json.members?.filter((m) => !m.is_ai).length ?? 0;
        if (prev && newCount > prevMemberCount.current) {
          const newMember = json.members.filter((m) => !m.is_ai).find(
            (m) => !prev.members.find((pm) => pm.id === m.id)
          );
          if (newMember) showToast(`${newMember.name}님이 참여했습니다`);
        }
        prevMemberCount.current = newCount;
        return json;
      });
      setKickoffDone(json.milestones?.length > 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    getSession().then(async (session) => {
      if (session) {
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "members", filter: `project_id=eq.${id}` }, fetchData)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "members", filter: `project_id=eq.${id}` }, fetchData)
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

  // 프로젝트 수정
  const openEdit = () => {
    const p = data.project;
    setEditForm({ title: p.title, goal: p.goal, subject: p.subject, duration_unit: p.duration_unit ?? null, duration_value: p.duration_value ?? 4 });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const du = editForm.duration_unit;
      const dv = Number(editForm.duration_value);
      const duration_weeks = !du ? 0
        : du === "hours" ? Math.ceil(dv / 168)
        : du === "days"  ? Math.ceil(dv / 7)
        : du === "weeks" ? dv
        : du === "months"? Math.ceil(dv * 4.33)
        : du === "years" ? Math.ceil(dv * 52)
        : 0;
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editForm.title, goal: editForm.goal, subject: editForm.subject, duration_unit: du, duration_value: du ? dv : null, duration_weeks }),
      });
      if (!res.ok) throw new Error("저장 실패");
      await fetchData();
      setEditing(false);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm("프로젝트를 삭제하면 모든 데이터가 사라집니다. 정말 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      router.replace("/home");
    } catch (e) { alert(e.message); setDeleting(false); }
  };

  // 프로필 수정
  const openProfileEdit = (member) => {
    setProfileEdit(member);
    setProfileForm({ name: member.name, skills: member.skills ?? [], personality: member.personality ?? "" });
  };

  const toggleSkill = (skill) => {
    setProfileForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await fetch(`/api/members/${profileEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (!res.ok) throw new Error("저장 실패");
      // 이름이 바뀌면 localStorage 업데이트
      if (profileForm.name !== profileEdit.name) {
        localStorage.setItem(`member_name_${id}`, profileForm.name);
      }
      await fetchData();
      setProfileEdit(null);
      showToast("프로필이 업데이트되었습니다");
    } catch (e) { alert(e.message); }
    finally { setProfileSaving(false); }
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></main>;
  if (error)   return <main className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></main>;

  const { project, members, milestones } = data;
  const humanMembers = members.filter((m) => !m.is_ai);
  const currentWeek = getCurrentWeek(project.created_at, project.duration_value, project.duration_unit);
  const currentMilestone = milestones.find((ms) => ms.week === currentWeek) ?? milestones[0];
  const daysLeft = getDaysLeft(project.created_at, project.duration_value, project.duration_unit);
  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${project.invite_code}`;
  const myName = typeof window !== "undefined" ? localStorage.getItem(`member_name_${id}`) : null;

  return (
    <main className="min-h-screen" style={{ backgroundColor: theme.bg }}>
      {/* 채팅 패널 */}
      <ChatPanel projectId={id} myMemberId={myMemberId} myName={myName} accentColor={theme.accent} isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* 채팅 플로팅 버튼 */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="btn-jelly fixed bottom-6 right-6 z-30 rounded-2xl text-white flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`, boxShadow: `0 4px 20px ${theme.accent}50`, width: 52, height: 52 }}
          title="팀 채팅"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      )}

      {/* 토스트 알림 */}
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`, animation: "fadeInDown 0.3s ease" }}
        >
          {toast}
        </div>
      )}

      {/* 프로젝트 수정 모달 */}
      {editing && editForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setEditing(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">프로젝트 수정</h2>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">프로젝트 이름</label>
              <input className="input-drop w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">프로젝트 목표</label>
              <textarea className="input-drop w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" rows={2} value={editForm.goal} onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">과목 / 카테고리</label>
              <input className="input-drop w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">기간</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {UNIT_OPTIONS.map((opt) => (
                  <button key={String(opt.value)} type="button"
                    onClick={() => setEditForm({ ...editForm, duration_unit: opt.value, duration_value: opt.value && VALUE_OPTIONS[opt.value] ? VALUE_OPTIONS[opt.value][0] : null })}
                    className="px-2.5 py-1 rounded-lg text-xs border transition-colors"
                    style={editForm.duration_unit === opt.value ? { backgroundColor: theme.accent, color: "white", borderColor: theme.accent } : { borderColor: "#e5e7eb", color: "#6b7280" }}
                  >{opt.label}</button>
                ))}
              </div>
              {editForm.duration_unit && (
                <select className="input-drop w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={editForm.duration_value} onChange={(e) => setEditForm({ ...editForm, duration_value: e.target.value })}>
                  {(VALUE_OPTIONS[editForm.duration_unit] ?? []).map((v) => (
                    <option key={v} value={v}>{v} {{ hours:"시간",days:"일",weeks:"주",months:"달",years:"년" }[editForm.duration_unit]}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 btn-jelly">취소</button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 btn-jelly" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)` }}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>

            {/* 삭제 영역 */}
            <div className="border-t border-red-100 pt-4 mt-2">
              <p className="text-xs text-gray-400 mb-2">위험 영역 — 되돌릴 수 없습니다</p>
              <button onClick={handleDelete} disabled={deleting} className="btn-jelly w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors">
                {deleting ? "삭제 중..." : "프로젝트 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 본인 프로필 수정 모달 */}
      {profileEdit && profileForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setProfileEdit(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">내 프로필 수정</h2>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">이름</label>
              <input className="input-drop w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">스킬</label>
              <div className="flex flex-wrap gap-1.5">
                {SKILLS.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSkill(s)}
                    className="px-2.5 py-1 rounded-full text-xs border transition-colors btn-jelly"
                    style={profileForm.skills.includes(s) ? { backgroundColor: theme.accent, color: "white", borderColor: theme.accent } : { borderColor: "#e5e7eb", color: "#6b7280" }}
                  >{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">성향</label>
              <div className="space-y-2">
                {PERSONALITIES.map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer group">
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={profileForm.personality === p ? { borderColor: theme.accent, backgroundColor: theme.accent } : { borderColor: "#d1d5db" }}
                      onClick={() => setProfileForm({ ...profileForm, personality: p })}
                    >
                      {profileForm.personality === p && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900" onClick={() => setProfileForm({ ...profileForm, personality: p })}>{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setProfileEdit(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 btn-jelly">취소</button>
              <button onClick={handleSaveProfile} disabled={profileSaving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 btn-jelly" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)` }}>
                {profileSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="border-b px-6 py-4" style={{ backgroundColor: theme.bg, borderColor: "rgba(0,0,0,0.07)" }}>
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <button onClick={() => router.push("/home")} className="text-xs text-gray-400 hover:text-gray-600 mb-1 block transition-colors">← 마이페이지</button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{project.title}</h1>
              {isOwner && (
                <button onClick={openEdit} className="btn-jelly text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-0.5 transition-colors">
                  수정
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{project.subject} · {formatDuration(project.duration_value, project.duration_unit)}</p>
          </div>
          <div className="text-right">
            {daysLeft === null ? (
              <p className="text-sm font-medium text-gray-400">기한 없음</p>
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums" style={{ color: theme.accent }}>D-{daysLeft}</p>
                <p className="text-xs text-gray-400">마감까지</p>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* 초대 코드 / 킥오프 (방장 전용) */}
        {isOwner && (
          <section className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">팀원 초대</h2>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{humanMembers.length}명 참여 중</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5">
                <p className="text-xs text-gray-400 mb-0.5">초대 코드</p>
                <p className="font-mono font-bold text-lg tracking-widest" style={{ color: theme.accent }}>{project.invite_code}</p>
              </div>
              <button onClick={() => handleCopy(inviteUrl)} className="btn-jelly px-4 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)` }}>
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>
            {!kickoffDone ? (
              <button onClick={handleKickoff} disabled={kickoffLoading || humanMembers.length === 0}
                className="btn-jelly w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)` }}>
                {kickoffLoading ? "AI 역할 설계 중... (10~20초)" : `AI 킥오프 실행 (${humanMembers.length}명)`}
              </button>
            ) : (
              <p className="text-sm text-green-600 font-medium text-center">킥오프 완료 — 역할 및 마일스톤이 설계되었습니다.</p>
            )}
          </section>
        )}

        {!isOwner && !myMemberId && (
          <section className="rounded-xl p-4 text-center" style={{ backgroundColor: `${theme.accent}10`, border: `1px solid ${theme.accent}20` }}>
            <p className="text-sm font-medium" style={{ color: theme.accent }}>초대 링크로 접속하셨나요?</p>
            <p className="text-xs text-gray-500 mt-1">초대 링크 → 참여하기를 완료해야 기여를 입력할 수 있어요.</p>
          </section>
        )}

        {/* 목표 */}
        <section className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">프로젝트 목표</p>
          <p className="text-gray-800 font-medium">{project.goal}</p>
          {kickoffDone && project.duration_weeks > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span>{currentWeek}주차 진행 중</span>
                <span>총 {project.duration_weeks}주</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min((currentWeek / project.duration_weeks) * 100, 100)}%`, backgroundColor: theme.accent }} />
              </div>
            </div>
          )}
        </section>

        {/* 팀원 카드 — 본인 카드는 클릭해서 프로필 수정 */}
        <section className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          <h2 className="font-semibold text-gray-800 mb-4">
            팀원 {humanMembers.length > 0 ? <span className="text-gray-400 font-normal text-sm">({humanMembers.length}명)</span> : ""}
          </h2>
          {humanMembers.length === 0 ? (
            <p className="text-sm text-gray-400">아직 참여한 팀원이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {humanMembers.map((m) => {
                const isMe = m.id === myMemberId;
                return (
                  <div
                    key={m.id}
                    onClick={() => isMe && openProfileEdit(m)}
                    className={`rounded-xl p-3 border transition-all ${isMe ? "cursor-pointer hover:shadow-md" : ""}`}
                    style={{
                      borderColor: `${theme.accent}25`,
                      backgroundColor: `${theme.accent}07`,
                      ...(isMe ? { boxShadow: `0 0 0 0 ${theme.accent}30` } : {}),
                    }}
                    onMouseEnter={(e) => isMe && (e.currentTarget.style.boxShadow = `0 4px 16px ${theme.accent}20`)}
                    onMouseLeave={(e) => isMe && (e.currentTarget.style.boxShadow = "none")}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}aa)` }}>
                        {m.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                          {isMe && <span className="text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0" style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}>나</span>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{m.role ?? "역할 미배정"}</p>
                      </div>
                      {isMe && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-300 shrink-0">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      )}
                    </div>
                    {m.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">{s}</span>
                        ))}
                        {m.skills.length > 3 && <span className="text-xs text-gray-400">+{m.skills.length - 3}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 마일스톤 */}
        {kickoffDone && currentMilestone && (
          <section className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800">{currentMilestone.week}주차 마일스톤</h2>
              <span className="text-xs px-2.5 py-1 rounded-full text-white font-medium" style={{ backgroundColor: theme.accent }}>{currentMilestone.title}</span>
            </div>
            <ul className="space-y-2">
              {(currentMilestone.tasks ?? []).map((task, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 w-4 h-4 rounded border border-gray-200 flex-shrink-0" />
                  {task}
                </li>
              ))}
            </ul>
          </section>
        )}

        {kickoffDone && (myMemberId || isOwner) && (
          <ContributionForm projectId={id} members={humanMembers} myMemberId={myMemberId} accentColor={theme.accent} onSubmit={fetchData} />
        )}

        {kickoffDone && isOwner && (
          <WeeklyReviewButton projectId={id} currentWeek={currentWeek} accentColor={theme.accent} />
        )}
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </main>
  );
}

function getDeadline(createdAt, dv, du) {
  if (!du || !dv) return null;
  const ms = { hours: dv*3600000, days: dv*86400000, weeks: dv*604800000, months: dv*2629440000, years: dv*31557600000 }[du] ?? 0;
  return new Date(new Date(createdAt).getTime() + ms);
}
function getDaysLeft(createdAt, dv, du) {
  const d = getDeadline(createdAt, dv, du);
  if (!d) return null;
  const diff = d - new Date();
  if (du === "hours") return Math.max(Math.ceil(diff / 3600000), 0) + "h";
  return Math.max(Math.ceil(diff / 86400000), 0);
}
function getCurrentWeek(createdAt, dv, du) {
  const total = du === "weeks" ? dv : du === "months" ? Math.ceil(dv * 4.33) : du === "years" ? Math.ceil(dv * 52) : du === "days" ? Math.ceil(dv / 7) : 1;
  const w = Math.floor((new Date() - new Date(createdAt)) / 604800000) + 1;
  return Math.min(Math.max(w, 1), total || 1);
}
function formatDuration(v, u) {
  if (!u) return "기한 없음";
  return `${v}${{ hours:"시간", days:"일", weeks:"주", months:"달", years:"년" }[u] ?? ""}`;
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useDialog } from "@/components/DialogProvider";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSession, getProfile } from "@/lib/auth";
import ChatPanel from "@/components/ChatPanel";
import JournalPanel from "@/components/JournalPanel";
import TasksSection from "@/components/TasksSection";
import PlanningDocs from "@/components/PlanningDocs";
import FilesSection from "@/components/FilesSection";
import Spinner from "@/components/Spinner";
import AggregateReport from "@/components/AggregateReport";
import AIArchive from "@/components/AIArchive";
import MilestonesSection from "@/components/MilestonesSection";

const DEFAULT_SKILLS = ["React","Vue","Next.js","Node.js","Python","Java","Spring","DB 설계","UI/UX 디자인","기획/PM","데이터 분석","문서화","Flutter","Swift","Kotlin","TypeScript","Go","C++","DevOps","Figma"];
const UNIT_OPTIONS = [
  { value:"hours",label:"시간"},{value:"days",label:"일"},{value:"weeks",label:"주"},
  {value:"months",label:"달"},{value:"years",label:"년"},{value:null,label:"기한 없음"},
];
const VALUE_OPTIONS = { hours:[1,2,3,4,6,8,12,24,48],days:[1,2,3,4,5,6,7,10,14],weeks:[1,2,3,4,5,6,8,10,12,16,20,24],months:[1,2,3,4,5,6,9,12],years:[1,2,3,5] };
const ACCENT = "#2563eb";

export default function ProjectDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const prevMemberCount = useRef(0);

  const dialog = useDialog();
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [userId, setUserId]         = useState(null);
  const [isOwner, setIsOwner]       = useState(false);
  const [myMemberId, setMyMemberId] = useState(null);
  const [myMember, setMyMember]     = useState(null);
  const [copied, setCopied]         = useState(false);
  const [kickoffLoading, setKickoffLoading]     = useState(false);
  const [kickoffDone, setKickoffDone]           = useState(false);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [aggregateResult, setAggregateResult]   = useState(null);
  const [archiveOpen, setArchiveOpen]           = useState(false);
  const [chatOpen, setChatOpen]         = useState(false);
  const [journalOpen, setJournalOpen]   = useState(false);
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);
  const [toast, setToast]           = useState(null);

  // 프로젝트 수정
  const [editing, setEditing]       = useState(false);
  const [editForm, setEditForm]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // 프로필 수정 (본인 + 관리자가 타인 수정도 여기서)
  const [profileEdit, setProfileEdit]   = useState(null);
  const [profileForm, setProfileForm]   = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [skillInput, setSkillInput]     = useState("");

  // 다른 멤버 프로필 보기
  const [viewMember, setViewMember] = useState(null);
  const [vmFriend, setVmFriend]     = useState(null); // { relation, requestId? }

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
          const newM = json.members.filter((m) => !m.is_ai).find((m) => !prev.members.find((pm) => pm.id === m.id));
          if (newM) showToast(`${newM.name}님이 참여했습니다`);
        }
        prevMemberCount.current = newCount;
        return json;
      });
      setKickoffDone(json.milestones?.length > 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [id, showToast]);

  useEffect(() => {
    getSession().then((s) => { if (s) setUserId(s.user.id); });
    fetchData();

    const ch = supabase.channel(`proj-${id}`)
      .on("postgres_changes", { event: "*",      schema: "public", table: "contribution_logs", filter: `project_id=eq.${id}` }, fetchData)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "members",           filter: `project_id=eq.${id}` }, fetchData)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "members",           filter: `project_id=eq.${id}` }, fetchData)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "members",           filter: `project_id=eq.${id}` }, (payload) => {
        // 내가 내보내진 경우 → 홈으로 리다이렉트
        const deletedMemberId = payload.old?.id;
        setMyMemberId((prev) => {
          if (prev && prev === deletedMemberId) {
            router.replace("/home");
          }
          return prev;
        });
        fetchData();
      })
      .on("postgres_changes", { event: "*",      schema: "public", table: "milestones",        filter: `project_id=eq.${id}` }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [id, fetchData]);

  // auth userId + DB 데이터로 신원 확인 (localStorage는 캐시로만)
  useEffect(() => {
    if (!data || !userId) return;
    if (data.project.owner_id === userId) {
      setIsOwner(true);
      if (data.project.owner_code) localStorage.setItem(`owner_${id}`, data.project.owner_code);
    }
    const myM = data.members.find((m) => m.user_id === userId && !m.is_ai);
    if (myM) {
      setMyMemberId(myM.id);
      localStorage.setItem(`member_id_${id}`, myM.id);
      localStorage.setItem(`member_name_${id}`, myM.name);
    }
  }, [data, userId, id]);

  // myMember 동기화
  useEffect(() => {
    if (data && myMemberId) setMyMember(data.members.find((m) => m.id === myMemberId) ?? null);
  }, [data, myMemberId]);

  const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleKickoff = async () => {
    setKickoffLoading(true);
    try {
      const res = await fetch("/api/kickoff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project_id: id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetchData();
      setKickoffDone(true);
      showToast("AI 킥오프가 완료되었습니다");
    } catch (e) { await dialog.alert("킥오프 실패: " + e.message); }
    finally { setKickoffLoading(false); }
  };

  const handleAggregate = async () => {
    setAggregateLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/aggregate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "분석 실패");
      setAggregateResult(json);
    } catch (e) { await dialog.alert("집계 실패: " + e.message); }
    finally { setAggregateLoading(false); }
  };

  const openEdit = () => {
    const p = data.project;
    setEditForm({ title: p.title, goal: p.goal, subject: p.subject, duration_unit: p.duration_unit ?? null, duration_value: p.duration_value ?? 4 });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const du = editForm.duration_unit, dv = Number(editForm.duration_value);
      const dw = !du ? 0 : du==="hours"?Math.ceil(dv/168):du==="days"?Math.ceil(dv/7):du==="weeks"?dv:du==="months"?Math.ceil(dv*4.33):Math.ceil(dv*52);
      const res = await fetch(`/api/projects/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title:editForm.title,goal:editForm.goal,subject:editForm.subject,duration_unit:du,duration_value:du?dv:null,duration_weeks:dw }) });
      if (!res.ok) throw new Error("저장 실패");
      await fetchData(); setEditing(false); showToast("저장되었습니다");
    } catch (e) { await dialog.alert(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!await dialog.confirm(
      "프로젝트를 삭제하면 모든 데이터가 사라집니다.\n정말 삭제하시겠습니까?",
      { title: "프로젝트 삭제", confirmText: "삭제", danger: true }
    )) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      router.replace("/home");
    } catch (e) { await dialog.alert(e.message); setDeleting(false); }
  };

  const handleToggleAdmin = async (member) => {
    await fetch(`/api/members/${member.id}/admin`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ is_admin: !member.is_admin }) });
    await fetchData();
    showToast(member.is_admin ? `${member.name} 관리자 해제` : `${member.name} 관리자 지정`);
  };

  const openProfileEdit = (member) => {
    setProfileEdit(member);
    setProfileForm({ name: member.name, role: member.role ?? "", skills: member.skills ?? [], personality: member.personality ?? "" });
    setSkillInput("");
  };

  const addSkillToForm = (s) => {
    const trimmed = s.trim();
    if (!trimmed) return;
    setProfileForm((prev) => prev.skills.includes(trimmed) ? prev : { ...prev, skills: [...prev.skills, trimmed] });
    setSkillInput("");
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const body = { name: profileForm.name, skills: profileForm.skills, personality: profileForm.personality, role: profileForm.role || null };
      const res = await fetch(`/api/members/${profileEdit.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("저장 실패");
      // 내 이름 변경 시 로컬 캐시 갱신
      if (profileEdit.id === myMemberId && profileForm.name !== profileEdit.name) localStorage.setItem(`member_name_${id}`, profileForm.name);
      await fetchData(); setProfileEdit(null); showToast("프로필이 업데이트되었습니다");
    } catch (e) { await dialog.alert(e.message); }
    finally { setProfileSaving(false); }
  };

  // viewMember 열릴 때 친구 관계 조회
  useEffect(() => {
    if (!viewMember?.user_id || !userId) { setVmFriend(null); return; }
    let cancelled = false;
    (async () => {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`/api/friends?userId=${userId}`),
        fetch(`/api/friends/requests?userId=${userId}`),
      ]);
      const [friends, reqs] = await Promise.all([friendsRes.json(), requestsRes.json()]);
      if (cancelled) return;
      if (Array.isArray(friends) && friends.find((f) => f.id === viewMember.user_id)) {
        setVmFriend({ relation: "accepted" });
      } else if (reqs?.received) {
        const recv = reqs.received.find((r) => r.sender_id === viewMember.user_id);
        const sent = reqs.sent?.find((r) => r.recipient_id === viewMember.user_id);
        if (recv) setVmFriend({ relation: "pending_received", requestId: recv.id });
        else if (sent) setVmFriend({ relation: "pending_sent", requestId: sent.id });
        else setVmFriend({ relation: "none" });
      } else {
        setVmFriend({ relation: "none" });
      }
    })();
    return () => { cancelled = true; };
  }, [viewMember, userId]);

  const handleVmFriendAction = async (action, requestId) => {
    if (action === "send") {
      const res = await fetch("/api/friends", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: userId, recipientId: viewMember.user_id }),
      });
      if (res.ok) { const d = await res.json(); setVmFriend({ relation: "pending_sent", requestId: d.id }); }
    } else {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        if (action === "accept") setVmFriend({ relation: "accepted" });
        else setVmFriend({ relation: "none" });
      }
    }
  };

  if (loading) return (
    <main className="page-water flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} />
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    </main>
  );
  if (error)   return <main className="page-water flex items-center justify-center"><p className="text-red-500">{error}</p></main>;

  const { project, members, milestones } = data;
  const humanMembers = members.filter((m) => !m.is_ai);
  const currentWeek  = getCurrentWeek(project.created_at, project.duration_value, project.duration_unit);
  const currentMilestone = milestones.find((ms) => ms.week === currentWeek) ?? milestones[0];
  const daysLeft = getDaysLeft(project.created_at, project.duration_value, project.duration_unit);
  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${project.invite_code}`;
  const myName = myMember?.name ?? null;
  const isAdmin = myMember?.is_admin ?? false;

  // 멤버 아바타 색상 — 인덱스마다 다른 색
  const AVATAR_GRADIENTS = [
    "linear-gradient(135deg,#2563eb,#1d4ed8)",
    "linear-gradient(135deg,#7c3aed,#6d28d9)",
    "linear-gradient(135deg,#0891b2,#0e7490)",
    "linear-gradient(135deg,#059669,#047857)",
    "linear-gradient(135deg,#d97706,#b45309)",
    "linear-gradient(135deg,#db2777,#be185d)",
  ];

  return (
    <main className="page-water min-h-screen relative overflow-x-hidden">
      {/* 배경 물방울 데코 */}
      <div className="fixed pointer-events-none" aria-hidden style={{top:"-60px",right:"-80px",width:320,height:370,opacity:0.055,zIndex:0}}>
        <svg viewBox="0 0 320 370" fill="none"><path d="M160 10C160 10 30 130 30 220C30 300 87 360 160 360C233 360 290 300 290 220C290 130 160 10 160 10Z" fill={ACCENT}/></svg>
      </div>
      <div className="fixed pointer-events-none" aria-hidden style={{bottom:"-40px",left:"-60px",width:240,height:280,opacity:0.04,zIndex:0}}>
        <svg viewBox="0 0 240 280" fill="none"><path d="M120 8C120 8 20 100 20 168C20 228 65 272 120 272C175 272 220 228 220 168C220 100 120 8 120 8Z" fill={ACCENT}/></svg>
      </div>

      {/* 일지 패널 (좌측) */}
      <JournalPanel
        projectId={id}
        myMemberId={myMemberId}
        myName={myName}
        isOpen={journalOpen}
        onClose={() => setJournalOpen(false)}
        canManage={isOwner || isAdmin}
        onJournalCreated={() => { setArchiveRefreshKey((k) => k + 1); setArchiveOpen(true); }}
      />

      {/* 채팅 패널 (우측) */}
      <ChatPanel projectId={id} myMemberId={myMemberId} myName={myName} accentColor={ACCENT} isOpen={chatOpen} onClose={() => setChatOpen(false)} canUseAI={isOwner || isAdmin} />

      {/* 플로팅 버튼들 — 반대 패널이 열려있어도 항상 표시 */}
      {!journalOpen && (
        <button onClick={() => setJournalOpen(true)} className="btn-jelly fixed bottom-6 left-6 z-30 rounded-2xl text-white flex items-center justify-center"
          style={{ background:"linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow:"0 4px 20px rgba(99,102,241,0.5)", width:52, height:52 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </button>
      )}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} className="btn-jelly fixed bottom-6 right-6 z-30 rounded-2xl text-white flex items-center justify-center"
          style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow:`0 4px 20px rgba(37,99,235,0.5)`, width:52, height:52 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg" style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, animation:"fadeInDown 0.3s ease", transform:"translateX(-50%)" }}>
          {toast}
        </div>
      )}

      {/* 프로젝트 수정 모달 */}
      {editing && editForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setEditing(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">프로젝트 수정</h2>
            <div><label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">이름</label><input className="input-drop w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm" value={editForm.title} onChange={(e)=>setEditForm({...editForm,title:e.target.value})}/></div>
            <div><label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">목표</label><textarea className="input-drop w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm" rows={2} value={editForm.goal} onChange={(e)=>setEditForm({...editForm,goal:e.target.value})}/></div>
            <div><label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">과목/카테고리</label><input className="input-drop w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm" value={editForm.subject} onChange={(e)=>setEditForm({...editForm,subject:e.target.value})}/></div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">기간</label>
              <div className="flex gap-1.5 flex-wrap mb-2">
                {UNIT_OPTIONS.map((opt)=>(
                  <button key={String(opt.value)} type="button" onClick={()=>setEditForm({...editForm,duration_unit:opt.value,duration_value:opt.value&&VALUE_OPTIONS[opt.value]?VALUE_OPTIONS[opt.value][0]:null})}
                    className="btn-jelly px-2.5 py-1 rounded-lg text-xs border transition-all"
                    style={editForm.duration_unit===opt.value?{background:`linear-gradient(135deg,${ACCENT},#1d4ed8)`,color:"white",borderColor:"transparent"}:{borderColor:"rgba(37,99,235,0.12)",color:"#6b7280"}}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {editForm.duration_unit&&<select className="input-drop w-full border border-blue-100 rounded-xl px-3 py-2 text-sm bg-white" value={editForm.duration_value} onChange={(e)=>setEditForm({...editForm,duration_value:e.target.value})}>
                {(VALUE_OPTIONS[editForm.duration_unit]??[]).map((v)=><option key={v} value={v}>{v} {{hours:"시간",days:"일",weeks:"주",months:"달",years:"년"}[editForm.duration_unit]}</option>)}
              </select>}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={()=>setEditing(false)} className="btn-jelly flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">취소</button>
              <button onClick={handleSaveEdit} disabled={saving} className="btn-jelly flex-1 py-2.5 rounded-xl text-sm font-semibold text-white drop-btn disabled:opacity-50">{saving?"저장 중...":"저장"}</button>
            </div>
            <div className="border-t border-red-100 pt-4">
              <p className="text-xs text-gray-400 mb-2">위험 영역 — 되돌릴 수 없습니다</p>
              <button onClick={handleDelete} disabled={deleting} className="btn-jelly w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-50">{deleting?"삭제 중...":"프로젝트 삭제"}</button>
            </div>
          </div>
        </div>
      )}

      {/* 프로필 수정 모달 (본인 + 관리자/방장이 타인 수정) */}
      {profileEdit && profileForm && (() => {
        const isEditingSelf = profileEdit.id === myMemberId;
        const suggestions = DEFAULT_SKILLS.filter(
          (s) => !profileForm.skills.includes(s) && (skillInput === "" || s.toLowerCase().includes(skillInput.toLowerCase()))
        );
        return (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setProfileEdit(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900">
                {isEditingSelf ? "내 프로필 수정" : `프로필 수정 — ${profileEdit.name}`}
              </h2>

              {/* 이름 */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">이름</label>
                <input className="input-drop w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm" value={profileForm.name} onChange={(e)=>setProfileForm({...profileForm,name:e.target.value})}/>
              </div>

              {/* 역할 (킥오프 후 표시) */}
              {kickoffDone && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">역할</label>
                  <input className="input-drop w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm" placeholder="예) 프론트엔드 개발 · UI 설계" value={profileForm.role} onChange={(e)=>setProfileForm({...profileForm,role:e.target.value})}/>
                </div>
              )}

              {/* 스킬 — 검색 + 직접 입력 */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">스킬</label>
                {/* 선택된 스킬 태그 */}
                {profileForm.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {profileForm.skills.map((s)=>(
                      <span key={s} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold text-white"
                        style={{background:`linear-gradient(135deg,${ACCENT},#1d4ed8)`}}>
                        {s}
                        <button type="button" onClick={()=>setProfileForm((prev)=>({...prev,skills:prev.skills.filter((x)=>x!==s)}))}
                          className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* 검색/입력 */}
                <input
                  className="input-drop w-full border border-blue-100 rounded-xl px-3 py-2 text-sm mb-2"
                  placeholder="스킬 검색 또는 직접 입력 후 Enter…"
                  value={skillInput}
                  onChange={(e)=>setSkillInput(e.target.value)}
                  onKeyDown={(e)=>{ if(e.key==="Enter"){e.preventDefault(); addSkillToForm(skillInput);} }}
                />
                {/* 추천 칩 */}
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s)=>(
                      <button key={s} type="button" onClick={()=>addSkillToForm(s)}
                        className="btn-jelly px-2.5 py-1 rounded-full text-xs border transition-all"
                        style={{borderColor:"rgba(37,99,235,0.15)",color:"#4b6bda",backgroundColor:"rgba(37,99,235,0.04)"}}>
                        + {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* AI 참고 메모 (구 성향) */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">AI 참고 메모</label>
                <p className="text-xs text-gray-400 mb-2">역할, 특기, 관심사, 기여 가능한 일 등을 적어주세요. AI 킥오프 시 역할 배분에 참고합니다.</p>
                <textarea
                  className="input-drop w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm resize-none"
                  placeholder={"예) 백엔드 개발이 특기이고 DB 설계 경험이 있습니다.\n팀 내 문서화와 일정 관리도 맡고 싶습니다."}
                  rows={3}
                  value={profileForm.personality}
                  onChange={(e)=>setProfileForm({...profileForm,personality:e.target.value})}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={()=>setProfileEdit(null)} className="btn-jelly flex-1 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">취소</button>
                <button onClick={handleSaveProfile} disabled={profileSaving} className="btn-jelly flex-1 py-2.5 rounded-xl text-sm font-semibold text-white drop-btn disabled:opacity-50">{profileSaving?"저장 중...":"저장"}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 헤더 배너 ── */}
      <header className="relative z-10 px-6 pt-5 pb-6 overflow-hidden"
        style={{ background:`linear-gradient(135deg, ${ACCENT} 0%, #1d4ed8 60%, #312e81 100%)`, boxShadow:"0 4px 32px rgba(37,99,235,0.35)" }}>
        {/* 배너 내부 물방울 deco */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div style={{position:"absolute",top:"-30px",right:"60px",width:120,height:140,borderRadius:"50% 50% 50% 50%/60% 60% 40% 40%",background:"rgba(255,255,255,0.06)"}}/>
          <div style={{position:"absolute",bottom:"-20px",right:"10px",width:80,height:90,borderRadius:"50% 50% 50% 50%/60% 60% 40% 40%",background:"rgba(255,255,255,0.04)"}}/>
        </div>

        <div className="max-w-3xl mx-auto relative">
          <button onClick={()=>router.push("/home")} className="btn-jelly flex items-center gap-1 text-xs text-white/60 hover:text-white mb-3 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            마이페이지
          </button>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white leading-tight">{project.title}</h1>
                {isOwner && (
                  <button onClick={openEdit}
                    className="btn-jelly text-xs text-white/70 hover:text-white border rounded-lg px-2.5 py-1 transition-colors shrink-0"
                    style={{borderColor:"rgba(255,255,255,0.25)",backgroundColor:"rgba(255,255,255,0.1)"}}>
                    수정
                  </button>
                )}
              </div>
              <p className="text-white/55 text-xs mt-1">{project.subject} · {formatDuration(project.duration_value, project.duration_unit)}</p>
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{backgroundColor:"rgba(255,255,255,0.15)",color:"white"}}>
                  {humanMembers.length}명 참여
                </span>
                {kickoffDone && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{backgroundColor:"rgba(74,222,128,0.2)",color:"#86efac"}}>킥오프 완료</span>}
                {isOwner && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{backgroundColor:"rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.8)"}}>방장</span>}
                {isAdmin && !isOwner && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{backgroundColor:"rgba(167,139,250,0.2)",color:"#c4b5fd"}}>관리자</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              {daysLeft === null ? (
                <p className="text-white/50 text-sm font-medium">기한 없음</p>
              ) : (
                <>
                  <p className="text-3xl font-black text-white tabular-nums leading-none">D-{daysLeft}</p>
                  <p className="text-white/50 text-xs mt-1">마감까지</p>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4 relative z-10">

        {/* 초대/킥오프 (방장) */}
        {isOwner && (
          <section className="rounded-2xl p-5 space-y-4"
            style={{background:"white",border:"1px solid rgba(37,99,235,0.1)",boxShadow:"0 4px 24px rgba(37,99,235,0.08), 0 1px 4px rgba(37,99,235,0.04)"}}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{background:`linear-gradient(180deg, ${ACCENT}, #1d4ed8)`}}/>
                <h2 className="font-semibold text-gray-800">팀원 초대</h2>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{backgroundColor:"rgba(37,99,235,0.08)",color:ACCENT}}>{humanMembers.length}명 참여</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl px-4 py-2.5" style={{background:"linear-gradient(135deg,rgba(37,99,235,0.04),rgba(37,99,235,0.06))",border:"1px solid rgba(37,99,235,0.12)"}}>
                <p className="text-xs text-gray-400 mb-0.5">초대 코드</p>
                <p className="font-mono font-black text-xl tracking-[0.25em]" style={{color:ACCENT}}>{project.invite_code}</p>
              </div>
              <button onClick={()=>handleCopy(inviteUrl)} className="btn-jelly drop-btn px-4 py-3 rounded-xl text-sm shrink-0">{copied?"복사됨!":"링크 복사"}</button>
            </div>
            {/* 킥오프 버튼 — 1차/재킥오프 항상 표시 */}
            <button onClick={async () => {
              if (kickoffDone && !await dialog.confirm(
                "킥오프를 재실행하면 역할·마일스톤이 재설계됩니다.\n기존 마일스톤은 삭제됩니다.",
                { title: "킥오프 재실행", confirmText: "재실행", cancelText: "취소" }
              )) return;
              handleKickoff();
            }} disabled={kickoffLoading||humanMembers.length===0}
              className="btn-jelly drop-btn w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
              {kickoffLoading
                ? <span className="flex items-center justify-center gap-2"><Spinner size={16} color="white" />AI 역할 설계 중... (10~20초)</span>
                : kickoffDone
                  ? `킥오프 재실행 (${humanMembers.length}명) — 역할·마일스톤 재설계`
                  : `AI 킥오프 실행 (${humanMembers.length}명) — 기획안 참고`}
            </button>

            {/* 킥오프 완료 상태 + 집계 버튼 */}
            {kickoffDone && (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{backgroundColor:"rgba(74,222,128,0.08)",border:"1px solid rgba(74,222,128,0.2)"}}>
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0"/>
                  <p className="text-sm text-green-600 font-medium">킥오프 완료</p>
                </div>
                <button
                  onClick={handleAggregate}
                  disabled={aggregateLoading}
                  title="집계 에이전트"
                  className="btn-jelly flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 disabled:opacity-50"
                  style={{ background:`linear-gradient(135deg, #7c3aed, #6d28d9)`, color:"white", boxShadow:"0 3px 12px rgba(124,58,237,0.3)" }}>
                  {aggregateLoading
                    ? <><Spinner size={13} color="white" /><span>분석 중...</span></>
                    : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>집계</>}
                </button>
              </div>
            )}

            {/* 보관함 버튼 — 킥오프 전후 모두 표시 */}
            <button
              onClick={() => setArchiveOpen(true)}
              title="AI 작업물 보관함"
              className="btn-jelly w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
              style={{ backgroundColor:"rgba(37,99,235,0.07)", color:ACCENT, border:"1px solid rgba(37,99,235,0.15)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              AI 보관함
            </button>
          </section>
        )}

        {/* 보관함 — 일반 멤버용 (방장은 위 섹션에서 접근) */}
        {!isOwner && myMemberId && (
          <div className="flex justify-end">
            <button
              onClick={() => setArchiveOpen(true)}
              className="btn-jelly flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
              style={{ backgroundColor:"rgba(37,99,235,0.07)", color:ACCENT, border:"1px solid rgba(37,99,235,0.15)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              AI 보관함
            </button>
          </div>
        )}

        {!isOwner && !myMemberId && (
          <section className="rounded-xl p-4 text-center" style={{background:"linear-gradient(135deg,rgba(37,99,235,0.06),rgba(99,102,241,0.06))",border:"1px solid rgba(37,99,235,0.15)"}}>
            <p className="text-sm font-semibold" style={{color:ACCENT}}>초대 링크로 참여하셨나요?</p>
            <p className="text-xs text-gray-500 mt-1">초대 링크 → 참여하기를 완료해주세요.</p>
          </section>
        )}

        {/* 프로젝트 목표 */}
        <section className="rounded-2xl p-5"
          style={{background:"white",border:"1px solid rgba(37,99,235,0.1)",boxShadow:"0 4px 24px rgba(37,99,235,0.08), 0 1px 4px rgba(37,99,235,0.04)"}}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded-full" style={{background:`linear-gradient(180deg, ${ACCENT}, #1d4ed8)`}}/>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">프로젝트 목표</p>
          </div>
          <p className="text-gray-800 font-medium leading-relaxed">{project.goal}</p>
          {kickoffDone && project.duration_weeks > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                <span className="font-medium" style={{color:ACCENT}}>{currentWeek}주차 진행 중</span>
                <span>총 {project.duration_weeks}주</span>
              </div>
              <div className="w-full rounded-full h-2.5" style={{backgroundColor:"rgba(37,99,235,0.08)"}}>
                <div className="h-2.5 rounded-full transition-all duration-700" style={{width:`${Math.min((currentWeek/project.duration_weeks)*100,100)}%`,background:`linear-gradient(90deg, ${ACCENT}, #1d4ed8)`,boxShadow:`0 0 8px rgba(37,99,235,0.4)`}}/>
              </div>
            </div>
          )}
        </section>

        {/* 기획안 */}
        <PlanningDocs projectId={id} memberId={myMemberId} memberName={myName} canUpload={isOwner||isAdmin} />

        {/* 팀원 — 컴팩트 아이콘 행 */}
        <section className="rounded-2xl px-5 py-4"
          style={{background:"white",border:"1px solid rgba(37,99,235,0.1)",boxShadow:"0 4px 24px rgba(37,99,235,0.08), 0 1px 4px rgba(37,99,235,0.04)"}}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{background:`linear-gradient(180deg, ${ACCENT}, #1d4ed8)`}}/>
              <h2 className="font-semibold text-gray-800">팀원 <span className="text-gray-400 font-normal text-sm">({humanMembers.length}명)</span></h2>
            </div>
          </div>
          {humanMembers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">아직 참여한 팀원이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {humanMembers.map((m, idx) => {
                const isMe = m.id === myMemberId;
                const avatarGrad = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                return (
                  <button key={m.id}
                    onClick={() => isMe ? openProfileEdit(m) : setViewMember(m)}
                    className="btn-jelly flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                    style={{
                      backgroundColor: isMe ? "rgba(37,99,235,0.06)" : "rgba(248,250,255,0.9)",
                      border: isMe ? "1.5px solid rgba(37,99,235,0.2)" : "1px solid rgba(37,99,235,0.1)",
                    }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{background:avatarGrad,boxShadow:"0 1px 5px rgba(0,0,0,0.15)"}}>
                      {m.name[0]}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-gray-800 leading-tight">{m.name}</p>
                        {isMe && <span className="text-xs font-bold" style={{color:ACCENT}}>나</span>}
                        {m.is_admin && <span className="text-xs font-semibold text-purple-500">·관리자</span>}
                        {(isOwner || isAdmin) && !isMe && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                      </div>
                      <p className="text-xs text-gray-400 leading-tight max-w-[90px] truncate">{m.role || (kickoffDone ? "역할 미배정" : "")}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 멤버 프로필 모달 (다른 사람 보기) */}
        {viewMember && (() => {
          const vm = viewMember;
          const vmIdx = humanMembers.findIndex((m) => m.id === vm.id);
          const avatarGrad = AVATAR_GRADIENTS[vmIdx % AVATAR_GRADIENTS.length];
          return (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setViewMember(null)}>
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                {/* 헤더 배너 */}
                <div className="px-6 pt-6 pb-5 relative" style={{background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`}}>
                  <button onClick={() => setViewMember(null)}
                    className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white"
                      style={{background:avatarGrad,boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
                      {vm.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white">{vm.name}</h3>
                        {vm.is_admin && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{backgroundColor:"rgba(167,139,250,0.3)",color:"#e9d5ff"}}>관리자</span>}
                      </div>
                      <p className="text-white/60 text-xs mt-0.5">{vm.role ?? "역할 미배정"}</p>
                    </div>
                  </div>
                </div>

                {/* 바디 */}
                <div className="px-6 py-4 space-y-4">
                  {/* 스킬 */}
                  {vm.skills?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">보유 스킬</p>
                      <div className="flex flex-wrap gap-1.5">
                        {vm.skills.map((s) => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium"
                            style={{backgroundColor:"rgba(37,99,235,0.07)",color:ACCENT,border:"1px solid rgba(37,99,235,0.12)"}}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 성향 */}
                  {vm.personality && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">성향</p>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{backgroundColor:"rgba(37,99,235,0.04)",border:"1px solid rgba(37,99,235,0.08)"}}>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor:ACCENT}}/>
                        <p className="text-sm text-gray-700">{vm.personality}</p>
                      </div>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex flex-col gap-2 pt-1">
                    {/* 친구 요청 / 메시지 버튼 */}
                    {vm.user_id && (() => {
                      const rel = vmFriend?.relation;
                      if (rel === "accepted") return (
                        <button
                          onClick={() => { setViewMember(null); router.push(`/home?tab=messages&dm=${vm.user_id}&name=${encodeURIComponent(vm.name)}`); }}
                          className="btn-jelly flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                          style={{background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`,boxShadow:`0 3px 12px rgba(37,99,235,0.3)`}}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          메시지 보내기
                        </button>
                      );
                      if (rel === "pending_sent") return (
                        <button onClick={() => handleVmFriendAction("cancel", vmFriend.requestId)}
                          className="btn-jelly flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                          style={{backgroundColor:"rgba(37,99,235,0.08)",color:ACCENT,border:`1px solid rgba(37,99,235,0.2)`}}>
                          요청 취소
                        </button>
                      );
                      if (rel === "pending_received") return (
                        <div className="flex gap-2">
                          <button onClick={() => handleVmFriendAction("accept", vmFriend.requestId)}
                            className="btn-jelly flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                            style={{background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`,boxShadow:`0 3px 12px rgba(37,99,235,0.3)`}}>수락</button>
                          <button onClick={() => handleVmFriendAction("reject", vmFriend.requestId)}
                            className="btn-jelly flex-1 py-2.5 rounded-xl text-sm font-semibold"
                            style={{backgroundColor:"rgba(37,99,235,0.07)",color:ACCENT,border:`1px solid rgba(37,99,235,0.15)`}}>거절</button>
                        </div>
                      );
                      // none or loading
                      return (
                        <button onClick={() => handleVmFriendAction("send")}
                          disabled={!vmFriend}
                          className="btn-jelly flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                          style={{background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`,boxShadow:`0 3px 12px rgba(37,99,235,0.3)`}}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                          </svg>
                          친구 요청
                        </button>
                      );
                    })()}
                    {/* 관리자: 프로필 수정 + 관리자 지정 */}
                    {(isOwner || isAdmin) && (
                      <div className="flex gap-2">
                        <button onClick={() => { setViewMember(null); openProfileEdit(vm); }}
                          className="btn-jelly flex-1 py-2 rounded-xl text-xs font-semibold"
                          style={{backgroundColor:"rgba(37,99,235,0.06)",color:ACCENT,border:"1px solid rgba(37,99,235,0.12)"}}>
                          프로필 수정
                        </button>
                        {isOwner && (
                          <button onClick={() => { handleToggleAdmin(vm); setViewMember(null); }}
                            className="btn-jelly flex-1 py-2 rounded-xl text-xs font-semibold"
                            style={vm.is_admin
                              ? {backgroundColor:"rgba(124,58,237,0.1)",color:"#7c3aed",border:"1px solid rgba(124,58,237,0.2)"}
                              : {backgroundColor:"rgba(37,99,235,0.07)",color:ACCENT,border:"1px solid rgba(37,99,235,0.15)"}}>
                            {vm.is_admin ? "관리자 해제" : "관리자 지정"}
                          </button>
                        )}
                      </div>
                    )}
                    {/* 방장: 내보내기 */}
                    {isOwner && vm.user_id !== userId && (
                      <button
                        onClick={async () => {
                          const ok = await dialog.confirm(`${vm.name}님을 프로젝트에서 내보내시겠습니까?`, { type: "danger" });
                          if (!ok) return;
                          const res = await fetch(`/api/members/${vm.id}?requesterId=${userId}`, { method: "DELETE" });
                          if (res.ok) { setViewMember(null); showToast(`${vm.name}님을 내보냈습니다`); }
                          else { const d = await res.json(); await dialog.alert(d.error ?? "내보내기 실패"); }
                        }}
                        className="btn-jelly w-full py-2 rounded-xl text-xs font-semibold"
                        style={{backgroundColor:"rgba(220,38,38,0.07)",color:"#dc2626",border:"1px solid rgba(220,38,38,0.2)"}}>
                        프로젝트에서 내보내기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 할일 블록 */}
        {humanMembers.length > 0 && (
          <TasksSection projectId={id} members={humanMembers} myMemberId={myMemberId} isOwner={isOwner||isAdmin} />
        )}

        {/* 로드맵 (마일스톤) */}
        {kickoffDone && milestones.length > 0 && (
          <MilestonesSection
            projectId={id}
            milestones={milestones}
            currentWeek={currentWeek}
            canEdit={isOwner || isAdmin}
          />
        )}

        {/* 파일 자료실 */}
        <FilesSection projectId={id} memberId={myMemberId} memberName={myName} />

        <div className="h-4"/>
      </div>

      {/* 집계 에이전트 리포트 모달 */}
      <AggregateReport report={aggregateResult} onClose={() => setAggregateResult(null)} />

      {/* AI 작업물 보관함 */}
      <AIArchive projectId={id} isOpen={archiveOpen} onClose={() => setArchiveOpen(false)} refreshKey={archiveRefreshKey} canManage={isOwner || isAdmin} />

      <style>{`
        @keyframes fadeInDown {
          from { opacity:0; transform:translate(-50%,-12px); }
          to   { opacity:1; transform:translate(-50%,0); }
        }
      `}</style>
    </main>
  );
}

function getDeadline(createdAt,dv,du){if(!du||!dv)return null;const ms={hours:dv*3600000,days:dv*86400000,weeks:dv*604800000,months:dv*2629440000,years:dv*31557600000}[du]??0;return new Date(new Date(createdAt).getTime()+ms);}
function getDaysLeft(createdAt,dv,du){const d=getDeadline(createdAt,dv,du);if(!d)return null;const diff=d-new Date();if(du==="hours")return Math.max(Math.ceil(diff/3600000),0)+"h";return Math.max(Math.ceil(diff/86400000),0);}
function getCurrentWeek(createdAt,dv,du){const total=du==="weeks"?dv:du==="months"?Math.ceil(dv*4.33):du==="years"?Math.ceil(dv*52):du==="days"?Math.ceil(dv/7):1;const w=Math.floor((new Date()-new Date(createdAt))/604800000)+1;return Math.min(Math.max(w,1),total||1);}
function formatDuration(v,u){if(!u)return"기한 없음";return`${v}${{hours:"시간",days:"일",weeks:"주",months:"달",years:"년"}[u]??""}`;}

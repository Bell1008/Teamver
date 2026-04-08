"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useDialog } from "@/components/DialogProvider";

const J = "#059669"; // 일지 그린
const J2 = "#047857";

/* ── 아이콘 ── */
const CloseIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const BookIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const SparkIcon  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const SaveIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const CheckIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function AchievementBadge({ rate }) {
  const pct = Math.round((rate ?? 0) * 100);
  const color = pct >= 75 ? J : pct >= 50 ? "#b45309" : "#dc2626";
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
      {pct}%
    </span>
  );
}

function EntryCard({ entry }) {
  return (
    <div className="mb-2 last:mb-0 rounded-xl p-3.5"
      style={{ backgroundColor: "#f8faff", border: "1px solid rgba(37,99,235,0.08)" }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-800">{entry.member_name}</span>
        <AchievementBadge rate={entry.achievement_rate} />
      </div>
      {entry.completed_tasks.map((t, i) => (
        <div key={i} className="flex items-start gap-1.5 mt-1">
          <div className="w-3.5 h-3.5 rounded flex items-center justify-center mt-0.5 shrink-0" style={{ backgroundColor: "rgba(5,150,105,0.15)" }}>
            <CheckIcon />
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">{t}</p>
        </div>
      ))}
      {entry.memo && <p className="text-xs text-gray-400 mt-2 italic pl-5">{entry.memo}</p>}
    </div>
  );
}

function DraftCard({ draft }) {
  return (
    <div className="mb-3 last:mb-0 rounded-xl p-3.5"
      style={{ backgroundColor: `rgba(5,150,105,0.04)`, border: `1px solid rgba(5,150,105,0.18)` }}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `rgba(5,150,105,0.15)` }}>
          <SparkIcon />
        </div>
        <span className="text-xs font-semibold" style={{ color: J }}>{draft.title}</span>
      </div>
      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{draft.content?.text}</p>
    </div>
  );
}

export default function JournalPanel({ projectId, myMemberId, myName, isOpen, onClose, canManage, onJournalCreated }) {
  const dialog = useDialog();
  const [entries, setEntries]       = useState([]);
  const [drafts, setDrafts]         = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [organizeLoading, setOrganizeLoading] = useState(false);
  const [createLoading, setCreateLoading]     = useState(false);
  const [form, setForm] = useState({ taskInput: "", memo: "", achievement_rate: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoadingData(true);
    const [entRes, drRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/contributions`),
      fetch(`/api/projects/${projectId}/artifacts?type=journal_draft`),
    ]);
    const [ent, dr] = await Promise.all([entRes.json(), drRes.json()]);
    if (Array.isArray(ent)) setEntries(ent);
    if (Array.isArray(dr))  setDrafts(dr);
    setLoadingData(false);
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchData();

    const ch = supabase.channel(`journal-${projectId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contribution_logs", filter: `project_id=eq.${projectId}` }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [isOpen, projectId, fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.taskInput.trim() || !myMemberId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: myMemberId,
          project_id: projectId,
          completed_tasks: form.taskInput.split("\n").map((t) => t.trim()).filter(Boolean),
          memo: form.memo,
          achievement_rate: Number(form.achievement_rate),
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setSubmitDone(true);
      setForm({ taskInput: "", memo: "", achievement_rate: 1 });
      await fetchData();
      setTimeout(() => setSubmitDone(false), 2000);
    } catch (e) { await dialog.alert(e.message); }
    finally { setSubmitting(false); }
  };

  const handleOrganize = async () => {
    setOrganizeLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/journal/organize`, { method: "POST" });
      const data = await res.json();
      if (data.error) { await dialog.alert(data.error, { type: "warning" }); return; }
      await fetchData();
    } finally { setOrganizeLoading(false); }
  };

  const handleCreate = async () => {
    if (!drafts.length) {
      await dialog.alert("먼저 '내용 정리'를 실행해주세요.", { type: "warning" });
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/journal/create`, { method: "POST" });
      const data = await res.json();
      if (data.error) { await dialog.alert(data.error, { type: "warning" }); return; }
      await dialog.alert("일지가 AI 보관함에 저장되었습니다.", { type: "success" });
      onJournalCreated?.(); // 보관함 새로고침 신호
    } finally { setCreateLoading(false); }
  };

  // 날짜별 그룹핑
  const grouped = {};
  for (const e of entries) {
    const day = e.date ?? e.created_at?.split("T")[0];
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  }
  const days = Object.keys(grouped).sort().reverse();
  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-30 sm:hidden" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 w-full sm:w-[380px] flex flex-col z-40 journal-enter"
        style={{ backgroundColor: "#fff", borderRight: "1px solid rgba(0,0,0,0.08)", boxShadow: "8px 0 40px rgba(0,0,0,0.12)" }}>

        {/* 헤더 */}
        <div className="shrink-0 px-4 pt-4 pb-3"
          style={{ background: `linear-gradient(135deg, ${J}, ${J2})`, boxShadow: `0 2px 16px rgba(5,150,105,0.35)` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <BookIcon />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">팀 일지</p>
                <p className="text-white/55 text-xs mt-0.5">기여를 기록하고 AI 일지로 정리하세요</p>
              </div>
            </div>
            <button onClick={onClose}
              className="btn-jelly w-8 h-8 flex items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <CloseIcon />
            </button>
          </div>

          {/* AI 버튼 */}
          <div className="flex gap-2">
            <button onClick={handleOrganize} disabled={organizeLoading || createLoading}
              className="btn-jelly flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ backgroundColor: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}>
              <SparkIcon />
              {organizeLoading ? "정리 중..." : "내용 정리"}
            </button>
            <button onClick={handleCreate} disabled={createLoading || organizeLoading}
              className="btn-jelly flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{ backgroundColor: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}>
              <SaveIcon />
              {createLoading ? "생성 중..." : "일지 만들기"}
            </button>
          </div>
        </div>

        {/* 바디 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {loadingData && entries.length === 0 && drafts.length === 0 && (
            <div className="flex justify-center pt-8">
              <div className="w-6 h-6 rounded-full border-2 border-green-200 border-t-green-500 animate-spin" />
            </div>
          )}

          {/* 정리된 내용 (drafts) */}
          {drafts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <SparkIcon />
                정리된 내용 ({drafts.length}건)
              </p>
              {drafts.map((d) => <DraftCard key={d.id} draft={d} />)}
            </div>
          )}

          {/* 날짜별 기여 기록 */}
          {days.map((day) => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2.5">
                <p className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {day === today ? "오늘" : formatDate(day)}
                </p>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(37,99,235,0.08)" }} />
                <span className="text-xs text-gray-400 shrink-0">{grouped[day].length}건</span>
              </div>
              {grouped[day].map((e) => <EntryCard key={e.id} entry={e} />)}
            </div>
          ))}

          {!loadingData && entries.length === 0 && drafts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-3 text-center">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `rgba(5,150,105,0.1)` }}>
                <BookIcon />
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                오늘의 기여를 기록해보세요.<br/>
                팀 전체 진행 상황을 AI가 정리해드려요.
              </p>
            </div>
          )}
        </div>

        {/* 입력 폼 */}
        {myMemberId ? (
          <form onSubmit={handleSubmit} className="shrink-0 px-4 py-4 space-y-2.5 border-t"
            style={{ borderColor: "rgba(5,150,105,0.12)", backgroundColor: "rgba(5,150,105,0.02)" }}>
            <p className="text-xs font-semibold text-gray-500">내 기여 기록</p>
            <textarea
              className="w-full rounded-2xl px-4 py-2.5 text-sm border outline-none resize-none"
              style={{ borderColor: "rgba(5,150,105,0.2)", backgroundColor: "#f8fffe" }}
              placeholder={`오늘 한 일 (줄바꿈으로 구분)\n예: 로그인 UI 구현\n    API 연동 테스트`}
              rows={3}
              value={form.taskInput}
              onChange={(e) => setForm({ ...form, taskInput: e.target.value })}
            />
            <input
              className="w-full rounded-xl px-4 py-2 text-sm border outline-none"
              style={{ borderColor: "rgba(5,150,105,0.15)", backgroundColor: "#f8fffe" }}
              placeholder="메모 (선택)"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500 whitespace-nowrap shrink-0">달성률</label>
              <input type="range" min="0" max="1" step="0.25" value={form.achievement_rate}
                onChange={(e) => setForm({ ...form, achievement_rate: e.target.value })}
                className="flex-1" style={{ accentColor: J }} />
              <span className="text-xs font-bold w-10 text-right" style={{ color: J }}>
                {Math.round(form.achievement_rate * 100)}%
              </span>
            </div>
            <button type="submit" disabled={submitting || !form.taskInput.trim()}
              className="btn-jelly w-full py-2.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${J}, ${J2})`, boxShadow: "0 3px 12px rgba(5,150,105,0.3)" }}>
              {submitDone ? "저장 완료!" : submitting ? "저장 중..." : "기여 기록"}
            </button>
          </form>
        ) : (
          <div className="px-4 py-3 shrink-0 border-t text-center"
            style={{ borderColor: "rgba(0,0,0,0.06)", backgroundColor: "#fafafa" }}>
            <p className="text-xs text-gray-400">참여 등록 후 기여 입력이 가능합니다.</p>
          </div>
        )}
      </div>
    </>
  );
}

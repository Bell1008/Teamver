"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useDialog } from "@/components/DialogProvider";
import AiResultModal from "@/components/AiResultModal";

const J  = "#2563eb";
const J2 = "#1d4ed8";

/* ── 아이콘 ── */
const CloseIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const BookIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const SparkIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const SaveIcon    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const CheckIcon   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const LockIcon    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const EditIcon    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const HistoryIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>;

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}
function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
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

/* ── 이전 버전 스냅샷 ── */
function HistorySnapshot({ snapshot, index, total }) {
  return (
    <div className="rounded-xl p-3 mt-1"
      style={{ backgroundColor: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-400">
          버전 {total - index} · {formatDateTime(snapshot.saved_at)}
        </span>
        <AchievementBadge rate={snapshot.achievement_rate} />
      </div>
      {(snapshot.completed_tasks ?? []).map((t, i) => (
        <div key={i} className="flex items-start gap-1.5 mt-1">
          <div className="w-3 h-3 rounded flex items-center justify-center mt-0.5 shrink-0"
            style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
            <CheckIcon />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed line-through">{t}</p>
        </div>
      ))}
      {snapshot.memo && (
        <p className="text-xs text-gray-400 mt-1.5 italic pl-4">{snapshot.memo}</p>
      )}
    </div>
  );
}

/* ── 기여 카드 (편집 + 히스토리) ── */
function EntryCard({ entry, isMine, onUpdated }) {
  const [editing, setEditing]         = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [editTasks, setEditTasks]     = useState(entry.completed_tasks.join("\n"));
  const [editMemo, setEditMemo]       = useState(entry.memo ?? "");
  const [editRate, setEditRate]       = useState(entry.achievement_rate);

  const historyList = [...(entry.history ?? [])].reverse(); // 최신 순

  const handleEdit = () => {
    setEditTasks(entry.completed_tasks.join("\n"));
    setEditMemo(entry.memo ?? "");
    setEditRate(entry.achievement_rate);
    setEditing(true);
    setShowHistory(false);
  };

  const handleSave = async () => {
    const tasks = editTasks.split("\n").map((t) => t.trim()).filter(Boolean);
    if (!tasks.length) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contributions/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed_tasks: tasks,
          memo: editMemo,
          achievement_rate: Number(editRate),
          requesterId: entry.member_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      onUpdated({ ...entry, ...data, history: data.history ?? [] });
      setEditing(false);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="mb-2 last:mb-0 rounded-xl overflow-hidden"
      style={{ border: `1px solid ${editing ? "rgba(37,99,235,0.25)" : "rgba(37,99,235,0.08)"}`, transition: "border-color 0.2s" }}>

      {/* 카드 헤더 */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-1.5"
        style={{ backgroundColor: "#f8faff" }}>
        <span className="text-xs font-bold text-gray-800">{entry.member_name}</span>
        <div className="flex items-center gap-1.5">
          <AchievementBadge rate={editing ? editRate : entry.achievement_rate} />
          {/* 이전 버전 버튼 */}
          {!editing && historyList.length > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs transition-colors"
              style={{
                backgroundColor: showHistory ? "rgba(37,99,235,0.1)" : "transparent",
                color: showHistory ? J : "#94a3b8",
              }}
              title="이전 버전 보기">
              <HistoryIcon />
              <span>{historyList.length}</span>
            </button>
          )}
          {/* 편집 버튼 (본인 기록만) */}
          {isMine && !editing && (
            <button
              onClick={handleEdit}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              title="수정">
              <EditIcon />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        /* ── 편집 모드 ── */
        <div className="px-3.5 pb-3.5 pt-2 space-y-2.5" style={{ backgroundColor: "#f8faff" }}>
          <textarea
            className="w-full rounded-xl px-3 py-2 text-xs border outline-none resize-none"
            style={{ borderColor: "rgba(37,99,235,0.2)", backgroundColor: "white" }}
            placeholder={"한 일 (줄바꿈으로 구분)"}
            rows={3}
            value={editTasks}
            onChange={(e) => setEditTasks(e.target.value)}
          />
          <input
            className="w-full rounded-xl px-3 py-2 text-xs border outline-none"
            style={{ borderColor: "rgba(37,99,235,0.15)", backgroundColor: "white" }}
            placeholder="메모 (선택)"
            value={editMemo}
            onChange={(e) => setEditMemo(e.target.value)}
          />
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-500 shrink-0">달성률</span>
            <input type="range" min="0" max="1" step="0.25" value={editRate}
              onChange={(e) => setEditRate(e.target.value)}
              className="flex-1" style={{ accentColor: J }} />
            <span className="text-xs font-bold w-8 text-right" style={{ color: J }}>
              {Math.round(editRate * 100)}%
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1.5 rounded-xl text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editTasks.trim()}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: `linear-gradient(135deg, ${J}, ${J2})` }}>
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      ) : (
        /* ── 뷰 모드 ── */
        <div className="px-3.5 pb-3 pt-1" style={{ backgroundColor: "#f8faff" }}>
          {entry.completed_tasks.map((t, i) => (
            <div key={i} className="flex items-start gap-1.5 mt-1">
              <div className="w-3.5 h-3.5 rounded flex items-center justify-center mt-0.5 shrink-0"
                style={{ backgroundColor: "rgba(5,150,105,0.15)" }}>
                <CheckIcon />
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{t}</p>
            </div>
          ))}
          {entry.memo && (
            <p className="text-xs text-gray-400 mt-2 italic pl-5">{entry.memo}</p>
          )}
        </div>
      )}

      {/* 이전 버전 목록 */}
      {showHistory && historyList.length > 0 && (
        <div className="px-3.5 pb-3 border-t" style={{ borderColor: "rgba(37,99,235,0.08)", backgroundColor: "#f8faff" }}>
          <p className="text-xs font-semibold text-gray-400 mt-2.5 mb-1.5 flex items-center gap-1.5">
            <HistoryIcon /> 이전 버전
          </p>
          {historyList.map((snap, i) => (
            <HistorySnapshot key={i} snapshot={snap} index={i} total={historyList.length} />
          ))}
        </div>
      )}
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
  const [aiModal, setAiModal] = useState(null);
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
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contribution_logs", filter: `project_id=eq.${projectId}` }, fetchData)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_artifacts",      filter: `project_id=eq.${projectId}` }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [isOpen, projectId, fetchData]);

  const handleEntryUpdated = useCallback((updated) => {
    setEntries((prev) => prev.map((e) => e.id === updated.id ? { ...e, ...updated } : e));
  }, []);

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
      setAiModal({
        title: data.title ?? "내용 정리",
        badge: "보관함에 저장됨",
        text: data.content?.text ?? "",
      });
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
      onJournalCreated?.();
      setAiModal({
        title: data.title ?? "팀 일지",
        badge: "AI 보관함에 저장됨",
        text: data.content?.text ?? "",
      });
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
      {aiModal && (
        <AiResultModal
          title={aiModal.title}
          text={aiModal.text}
          badge={aiModal.badge}
          onClose={() => setAiModal(null)}
        />
      )}

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
            {canManage ? (
              <button onClick={handleOrganize} disabled={organizeLoading || createLoading}
                className="btn-jelly flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ backgroundColor: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}>
                <SparkIcon />
                {organizeLoading ? "정리 중..." : "내용 정리"}
              </button>
            ) : (
              <div className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                style={{ backgroundColor: "rgba(0,0,0,0.15)", color: "rgba(255,255,255,0.45)" }}
                title="관리자 이상만 사용할 수 있습니다">
                <LockIcon />내용 정리
              </div>
            )}
            {canManage ? (
              <button onClick={handleCreate} disabled={createLoading || organizeLoading}
                className="btn-jelly flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ backgroundColor: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }}>
                <SaveIcon />
                {createLoading ? "생성 중..." : "일지 만들기"}
              </button>
            ) : (
              <div className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                style={{ backgroundColor: "rgba(0,0,0,0.15)", color: "rgba(255,255,255,0.45)" }}
                title="관리자 이상만 사용할 수 있습니다">
                <LockIcon />일지 만들기
              </div>
            )}
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
              {grouped[day].map((e) => (
                <EntryCard
                  key={e.id}
                  entry={e}
                  isMine={e.member_id === myMemberId}
                  onUpdated={handleEntryUpdated}
                />
              ))}
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

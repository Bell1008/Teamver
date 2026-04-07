"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Spinner from "@/components/Spinner";
import { useDialog } from "@/components/DialogProvider";

const ACCENT = "#2563eb";

// ── 개별 마일스톤 카드 ──────────────────────────────────────
function MilestoneCard({ ms, currentWeek, canEdit, onUpdated, onDeleted, dialog }) {
  const [open, setOpen]         = useState(ms.week === currentWeek);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editTitle, setEditTitle]   = useState(ms.title);
  const [editTasks, setEditTasks]   = useState([...ms.tasks]);
  const [newTask, setNewTask]   = useState("");

  const completed = ms.completed_tasks ?? [];
  const doneCount = completed.length;
  const total     = ms.tasks.length;
  const pct       = total ? Math.round((doneCount / total) * 100) : 0;
  const isCurrent = ms.week === currentWeek;
  const isDone    = pct === 100 && total > 0;

  const statusColor  = isDone ? "#16a34a" : isCurrent ? ACCENT : "#94a3b8";
  const statusBg     = isDone ? "rgba(74,222,128,0.1)" : isCurrent ? `rgba(37,99,235,0.08)` : "rgba(248,250,252,0.8)";
  const statusBorder = isDone ? "rgba(74,222,128,0.25)" : isCurrent ? `rgba(37,99,235,0.2)` : "rgba(226,232,240,0.8)";

  // 태스크 체크 토글
  const toggleTask = async (idx) => {
    const next = completed.includes(idx)
      ? completed.filter((i) => i !== idx)
      : [...completed, idx];
    await fetch(`/api/milestones/${ms.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed_tasks: next }),
    });
    onUpdated({ ...ms, completed_tasks: next });
  };

  // 인라인 저장
  const handleSave = async () => {
    const tasks = editTasks.filter((t) => t.trim());
    if (!editTitle.trim() || !tasks.length) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/milestones/${ms.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), tasks }),
      });
      const data = await res.json();
      onUpdated({ ...ms, ...data });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!await dialog.confirm(`"${ms.title}" 마일스톤을 삭제하시겠습니까?`, { title: "마일스톤 삭제", confirmText: "삭제", danger: true })) return;
    await fetch(`/api/milestones/${ms.id}`, { method: "DELETE" });
    onDeleted(ms.id);
  };

  const addTask = () => {
    const t = newTask.trim();
    if (!t) return;
    setEditTasks((prev) => [...prev, t]);
    setNewTask("");
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: statusBg, border: `1.5px solid ${statusBorder}`, boxShadow: isCurrent ? `0 4px 20px rgba(37,99,235,0.1)` : "none" }}
    >
      {/* 카드 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* 주차 배지 */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
          style={isDone
            ? { background: "linear-gradient(135deg,#16a34a,#15803d)", color: "white" }
            : isCurrent
              ? { background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, color: "white", boxShadow: `0 3px 10px rgba(37,99,235,0.35)` }
              : { backgroundColor: "white", color: "#94a3b8", border: "1.5px solid #e2e8f0" }
          }
        >
          {isDone ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : `W${ms.week}`}
        </div>

        {/* 제목 영역 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-semibold text-gray-800 truncate">{ms.title}</p>
            {isCurrent && !isDone && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `rgba(37,99,235,0.1)`, color: ACCENT }}>진행 중</span>
            )}
            {isDone && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "rgba(74,222,128,0.15)", color: "#16a34a" }}>완료</span>
            )}
          </div>
          {/* 진행 바 */}
          {total > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                <div className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: isDone ? "linear-gradient(90deg,#16a34a,#22c55e)" : `linear-gradient(90deg, ${ACCENT}, #1d4ed8)` }} />
              </div>
              <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: statusColor }}>{pct}%</span>
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && !editing && (
            <>
              <button onClick={() => { setEditing(true); setOpen(true); setEditTitle(ms.title); setEditTasks([...ms.tasks]); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={handleDelete}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </>
          )}
          {/* 펼치기 토글 */}
          <button onClick={() => setOpen((v) => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 펼쳐진 내용 */}
      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
          {editing ? (
            /* ── 편집 모드 ── */
            <div className="pt-3 space-y-3">
              <input
                className="w-full rounded-xl px-3 py-2 text-sm border bg-white"
                style={{ borderColor: "rgba(37,99,235,0.2)" }}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="마일스톤 제목"
              />
              <div className="space-y-1.5">
                {editTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-xl px-3 py-2 text-sm border bg-white"
                      style={{ borderColor: "rgba(37,99,235,0.12)" }}
                      value={t}
                      onChange={(e) => setEditTasks((prev) => prev.map((x, j) => j === i ? e.target.value : x))}
                    />
                    <button onClick={() => setEditTasks((prev) => prev.filter((_, j) => j !== i))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl px-3 py-2 text-sm border bg-white"
                    style={{ borderColor: "rgba(37,99,235,0.12)" }}
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
                    placeholder="태스크 추가 후 Enter…"
                  />
                  <button onClick={addTask}
                    className="btn-jelly px-3 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
                    추가
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="btn-jelly flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50">
                  취소
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="btn-jelly flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
                  {saving ? <Spinner size={14} color="white" /> : "저장"}
                </button>
              </div>
            </div>
          ) : (
            /* ── 체크 모드 ── */
            <ul className="pt-3 space-y-2">
              {ms.tasks.map((task, i) => {
                const done = completed.includes(i);
                return (
                  <li key={i}
                    className="flex items-start gap-2.5 cursor-pointer group"
                    onClick={() => toggleTask(i)}>
                    <div
                      className="mt-0.5 w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                      style={done
                        ? { backgroundColor: "#16a34a", borderColor: "#16a34a" }
                        : { borderColor: isCurrent ? `rgba(37,99,235,0.35)` : "#cbd5e1", backgroundColor: "white" }}
                    >
                      {done && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span
                      className="text-sm leading-relaxed transition-colors"
                      style={{ color: done ? "#94a3b8" : "#374151", textDecoration: done ? "line-through" : "none" }}>
                      {task}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── 섹션 전체 ──────────────────────────────────────────────
export default function MilestonesSection({ projectId, milestones: initialMilestones, currentWeek, canEdit }) {
  const dialog = useDialog();
  const [milestones, setMilestones] = useState(initialMilestones ?? []);
  const [collapsed, setCollapsed]   = useState(false);
  const [nextLoading, setNextLoading] = useState(false);

  // 부모에서 data가 바뀌면 동기화
  const [prevInitial, setPrevInitial] = useState(initialMilestones);
  if (initialMilestones !== prevInitial) {
    setPrevInitial(initialMilestones);
    setMilestones(initialMilestones ?? []);
  }

  const handleUpdated = useCallback((updated) => {
    setMilestones((prev) => prev.map((ms) => ms.id === updated.id ? updated : ms));
  }, []);

  const handleDeleted = useCallback((id) => {
    setMilestones((prev) => prev.filter((ms) => ms.id !== id));
  }, []);

  const handleGetNext = async () => {
    setNextLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/next`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "마일스톤 생성 실패");
      setMilestones((prev) => [...prev, data]);
    } catch (e) { await dialog.alert(e.message); }
    finally { setNextLoading(false); }
  };

  const totalTasks = milestones.reduce((s, ms) => s + ms.tasks.length, 0);
  const doneTasks  = milestones.reduce((s, ms) => s + (ms.completed_tasks?.length ?? 0), 0);
  const overallPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <section className="rounded-2xl overflow-hidden"
      style={{ background: "white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 4px 24px rgba(37,99,235,0.08), 0 1px 4px rgba(37,99,235,0.04)" }}>

      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${ACCENT}, #1d4ed8)` }} />
          <h2 className="font-semibold text-gray-800">로드맵</h2>
          {milestones.length > 0 && (
            <span className="text-xs text-gray-400 font-medium">{milestones.length}개 마일스톤</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 전체 진행도 */}
          {totalTasks > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-20 rounded-full h-1.5" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${overallPct}%`, background: `linear-gradient(90deg, ${ACCENT}, #1d4ed8)` }} />
              </div>
              <span className="text-xs font-semibold tabular-nums" style={{ color: ACCENT }}>{overallPct}%</span>
            </div>
          )}
          {/* 접기 버튼 */}
          <button onClick={() => setCollapsed((v) => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
            title={collapsed ? "펼치기" : "접기"}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 마일스톤 목록 */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-2.5 border-t" style={{ borderColor: "rgba(37,99,235,0.06)" }}>
          <div className="pt-3 space-y-2.5">
            {milestones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">킥오프 후 마일스톤이 생성됩니다.</p>
            ) : (
              milestones.map((ms) => (
                <MilestoneCard
                  key={ms.id}
                  ms={ms}
                  currentWeek={currentWeek}
                  canEdit={canEdit}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                  dialog={dialog}
                />
              ))
            )}
          </div>

          {/* 추가 마일스톤 받기 */}
          {milestones.length > 0 && (
            <button
              onClick={handleGetNext}
              disabled={nextLoading}
              className="btn-jelly w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ backgroundColor: "rgba(37,99,235,0.06)", color: ACCENT, border: `1.5px dashed rgba(37,99,235,0.2)` }}
            >
              {nextLoading ? (
                <><Spinner size={15} color={ACCENT} />다음 마일스톤 분석 중...</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                  AI로 다음 마일스톤 생성
                </>
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

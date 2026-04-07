"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#2563eb";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#2563eb,#1d4ed8)",
  "linear-gradient(135deg,#7c3aed,#6d28d9)",
  "linear-gradient(135deg,#0891b2,#0e7490)",
  "linear-gradient(135deg,#059669,#047857)",
  "linear-gradient(135deg,#d97706,#b45309)",
  "linear-gradient(135deg,#db2777,#be185d)",
];

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

function TaskBlock({ task, canEdit, onToggle, onEdit, onDelete }) {
  const [expanded, setExpanded]   = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle]         = useState(task.title);
  const [desc, setDesc]           = useState(task.description ?? "");
  const [progress, setProgress]   = useState(task.progress ?? 0);
  const done = task.status === "done";

  // sync if parent updates
  useEffect(() => { setTitle(task.title); }, [task.title]);
  useEffect(() => { setDesc(task.description ?? ""); }, [task.description]);
  useEffect(() => { setProgress(task.progress ?? 0); }, [task.progress]);

  const saveRemote = useCallback((updates) => {
    onEdit(task.id, updates);
  }, [task.id, onEdit]);

  const debouncedSave = useDebounce(saveRemote, 600);

  const saveTitle = () => {
    if (title.trim() && title !== task.title) onEdit(task.id, { title: title.trim() });
    setEditingTitle(false);
  };

  const handleProgressChange = (val) => {
    setProgress(val);
    debouncedSave({ progress: val });
  };

  const handleDescChange = (val) => {
    setDesc(val);
    debouncedSave({ description: val });
  };

  const progressColor = progress >= 80 ? "#059669" : progress >= 40 ? ACCENT : "#94a3b8";

  return (
    <div
      className="animate-fade-in-up rounded-xl overflow-hidden transition-all"
      style={{
        backgroundColor: done ? "rgba(37,99,235,0.03)" : "#fafbff",
        border: `1px solid ${done ? "rgba(37,99,235,0.06)" : "rgba(37,99,235,0.1)"}`,
        boxShadow: expanded ? "0 2px 12px rgba(37,99,235,0.07)" : "none",
      }}
    >
      {/* 메인 행 */}
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        {/* 체크박스 */}
        <button
          onClick={() => onToggle(task.id, done ? "todo" : "done")}
          className="btn-jelly mt-0.5 w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
          style={done ? { backgroundColor: ACCENT, borderColor: ACCENT } : { borderColor: "rgba(37,99,235,0.3)" }}
        >
          {done && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {/* 제목 + 진행률 바 */}
        <div className="flex-1 min-w-0" onClick={() => !editingTitle && setExpanded((v) => !v)} style={{ cursor: "pointer" }}>
          {editingTitle ? (
            <input
              autoFocus
              className="w-full text-xs bg-transparent border-b border-blue-300 focus:outline-none pb-0.5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") { setTitle(task.title); setEditingTitle(false); }
              }}
            />
          ) : (
            <p className={`text-xs leading-relaxed break-words ${done ? "line-through text-gray-400" : "text-gray-700"}`}>{task.title}</p>
          )}

          {/* 인라인 미니 진행률 바 */}
          {!done && progress > 0 && (
            <div className="mt-1.5 h-1 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: progressColor }}
              />
            </div>
          )}
        </div>

        {/* 진행률 뱃지 */}
        {progress > 0 && !done && (
          <span className="text-xs font-semibold shrink-0 tabular-nums" style={{ color: progressColor }}>{progress}%</span>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          {/* 펼치기 */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            className="btn-jelly w-5 h-5 flex items-center justify-center rounded-md transition-all"
            style={{ color: expanded ? ACCENT : "#94a3b8", backgroundColor: expanded ? "rgba(37,99,235,0.08)" : "rgba(0,0,0,0.03)" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {canEdit && !editingTitle && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
                className="btn-jelly w-5 h-5 flex items-center justify-center rounded-md transition-colors"
                style={{ color: "#94a3b8", backgroundColor: "rgba(0,0,0,0.03)" }}
                onMouseEnter={e => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)"; }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="btn-jelly w-5 h-5 flex items-center justify-center rounded-md transition-colors"
                style={{ color: "#94a3b8", backgroundColor: "rgba(0,0,0,0.03)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.03)"; }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 펼친 상세 영역 */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3" style={{ borderTop: "1px solid rgba(37,99,235,0.07)" }}>
          <div className="pt-2.5">
            {canEdit ? (
              <textarea
                className="input-drop w-full rounded-xl border border-blue-100 px-3 py-2 text-xs resize-none"
                style={{ backgroundColor: "rgba(37,99,235,0.02)", minHeight: 56 }}
                placeholder="메모 / 비고를 입력하세요..."
                value={desc}
                rows={2}
                onChange={(e) => handleDescChange(e.target.value)}
              />
            ) : (
              desc && <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            )}
          </div>

          {/* 진행률 슬라이더 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500">진행률</span>
              <span className="text-xs font-black tabular-nums" style={{ color: progressColor }}>{progress}%</span>
            </div>
            {canEdit ? (
              <div className="relative">
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={progress}
                  onChange={(e) => handleProgressChange(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${progressColor} ${progress}%, rgba(37,99,235,0.1) ${progress}%)`,
                    accentColor: progressColor,
                  }}
                />
              </div>
            ) : (
              <div className="h-2 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
                <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: progressColor }}/>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddTaskForm({ onAdd, onCancel }) {
  const [title, setTitle] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle("");
  };

  return (
    <form onSubmit={submit} className="flex gap-1.5 mt-1">
      <input
        autoFocus
        className="input-drop flex-1 border border-blue-100 rounded-lg px-2.5 py-1.5 text-xs"
        style={{ backgroundColor: "rgba(37,99,235,0.02)" }}
        placeholder="할 일 입력..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit" className="btn-jelly text-xs text-white px-3 py-1.5 rounded-lg drop-btn shrink-0">추가</button>
      <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-1.5 shrink-0">✕</button>
    </form>
  );
}

export default function TasksSection({ projectId, members, myMemberId, isOwner }) {
  const [tasks, setTasks]       = useState([]);
  const [addingFor, setAddingFor] = useState(null);

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/tasks`);
    const data = await res.json();
    if (Array.isArray(data)) setTasks(data);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
    const ch = supabase.channel(`tasks-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` }, fetchTasks)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [projectId, fetchTasks]);

  const handleAdd = async (memberId, title) => {
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId, title }),
    });
    setAddingFor(null);
  };

  const handleToggle = async (taskId, status) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const handleEdit = useCallback(async (taskId, updates) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  }, []);

  const handleDelete = async (taskId) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  };

  return (
    <section className="rounded-2xl p-5"
      style={{ background:"white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 4px 24px rgba(37,99,235,0.08), 0 1px 4px rgba(37,99,235,0.04)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${ACCENT}, #1d4ed8)` }}/>
        <h2 className="font-semibold text-gray-800">팀원 할일</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {members.filter((m) => !m.is_ai).map((member, idx) => {
          const memberTasks = tasks.filter((t) => t.member_id === member.id);
          const isMe = member.id === myMemberId;
          const canEdit = isMe || isOwner;
          const doneCount = memberTasks.filter((t) => t.status === "done").length;
          const totalProgress = memberTasks.length > 0
            ? Math.round(memberTasks.reduce((sum, t) => sum + (t.progress ?? 0), 0) / memberTasks.length)
            : 0;
          const avatarGrad = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];

          return (
            <div key={member.id} className="rounded-xl p-3.5"
              style={{
                backgroundColor: isMe ? "rgba(37,99,235,0.03)" : "rgba(248,250,255,0.8)",
                border: isMe ? "1.5px solid rgba(37,99,235,0.18)" : "1px solid rgba(37,99,235,0.08)",
              }}>
              {/* 멤버 헤더 */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: avatarGrad, boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
                  {member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800 truncate">{member.name}</p>
                    {isMe && <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold shrink-0" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: ACCENT }}>나</span>}
                    {member.is_admin && <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold text-purple-600 bg-purple-50 shrink-0">관리자</span>}
                  </div>
                  {memberTasks.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{doneCount}/{memberTasks.length} 완료 · 평균 {totalProgress}%</p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => setAddingFor(addingFor === member.id ? null : member.id)}
                    className="btn-jelly w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: addingFor === member.id ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.08)", color: ACCENT }}
                    title="할 일 추가"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* 전체 진행률 바 (태스크 있을 때) */}
              {memberTasks.length > 0 && (
                <div className="mb-2.5 h-1 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
                  <div
                    className="h-1 rounded-full transition-all duration-700"
                    style={{
                      width: `${totalProgress}%`,
                      background: `linear-gradient(90deg, ${ACCENT}, #1d4ed8)`,
                      boxShadow: totalProgress > 10 ? `0 0 6px rgba(37,99,235,0.3)` : "none",
                    }}
                  />
                </div>
              )}

              {/* 태스크 목록 */}
              <div className="space-y-1.5">
                {memberTasks.length === 0 && addingFor !== member.id && (
                  <p className="text-xs text-gray-300 text-center py-2">할 일이 없습니다.</p>
                )}
                {memberTasks.map((task) => (
                  <TaskBlock
                    key={task.id}
                    task={task}
                    canEdit={canEdit}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
                {addingFor === member.id && (
                  <AddTaskForm onAdd={(title) => handleAdd(member.id, title)} onCancel={() => setAddingFor(null)} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid ${ACCENT};
          box-shadow: 0 1px 4px rgba(37,99,235,0.3);
          cursor: pointer;
          transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
        }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.25); }
        input[type=range]::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          border: 2px solid ${ACCENT};
          cursor: pointer;
        }
        input[type=range] { -webkit-appearance: none; }
        input[type=range]::-webkit-slider-runnable-track { border-radius: 9999px; height: 6px; }
      `}</style>
    </section>
  );
}

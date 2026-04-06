"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#2563eb";

function TaskBlock({ task, canEdit, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const done = task.status === "done";

  const save = () => {
    if (title.trim() && title !== task.title) onEdit(task.id, { title: title.trim() });
    setEditing(false);
  };

  return (
    <div
      className="animate-fade-in-up flex items-start gap-2.5 px-3 py-2.5 rounded-xl group transition-all"
      style={{ backgroundColor: done ? "rgba(37,99,235,0.04)" : "#fafbff", border: "1px solid rgba(37,99,235,0.08)" }}
    >
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

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            className="w-full text-xs bg-transparent border-b border-blue-300 focus:outline-none pb-0.5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setTitle(task.title); setEditing(false); } }}
          />
        ) : (
          <p className={`text-xs leading-relaxed break-words ${done ? "line-through text-gray-400" : "text-gray-700"}`}>{task.title}</p>
        )}
      </div>

      {/* 수정/삭제 */}
      {canEdit && !editing && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-blue-500 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => onDelete(task.id)} className="text-gray-300 hover:text-red-400 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
            </svg>
          </button>
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
        placeholder="할 일 입력..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit" className="btn-jelly text-xs text-white px-2.5 py-1.5 rounded-lg drop-btn">추가</button>
      <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-1.5">✕</button>
    </form>
  );
}

export default function TasksSection({ projectId, members, myMemberId, isOwner }) {
  const [tasks, setTasks] = useState([]);
  const [addingFor, setAddingFor] = useState(null); // member_id

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

  const handleEdit = async (taskId, updates) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  const handleDelete = async (taskId) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  };

  const humanMembers = members.filter((m) => !m.is_ai);

  return (
    <section className="bg-white rounded-2xl p-5" style={{ border: "1px solid rgba(37,99,235,0.08)", boxShadow: "0 2px 16px rgba(37,99,235,0.04)" }}>
      <h2 className="font-semibold text-gray-800 mb-4">팀원 할일</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {humanMembers.map((member) => {
          const memberTasks = tasks.filter((t) => t.member_id === member.id);
          const isMe = member.id === myMemberId;
          const canEdit = isMe || isOwner || member.is_admin;
          const done = memberTasks.filter((t) => t.status === "done").length;

          return (
            <div key={member.id} className="rounded-xl p-3" style={{ backgroundColor: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.07)" }}>
              {/* 멤버 헤더 */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
                  {member.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">{member.name}</p>
                    {isMe && <span className="text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0" style={{ backgroundColor: "rgba(37,99,235,0.1)", color: ACCENT }}>나</span>}
                    {member.is_admin && !isOwner && <span className="text-xs px-1.5 py-0.5 rounded-md font-medium text-purple-600 bg-purple-50 shrink-0">관리자</span>}
                  </div>
                  {memberTasks.length > 0 && (
                    <p className="text-xs text-gray-400">{done}/{memberTasks.length} 완료</p>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => setAddingFor(addingFor === member.id ? null : member.id)}
                    className="btn-jelly w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                    style={{ backgroundColor: "rgba(37,99,235,0.08)", color: ACCENT }}
                    title="할 일 추가"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                )}
              </div>

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
    </section>
  );
}

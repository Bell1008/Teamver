"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#2563eb";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)    return "방금";
  if (diff < 3600)  return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

const TYPE_META = {
  friend_request: { label: "친구 요청", color: "#7c3aed", bg: "#f5f3ff",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> },
  friend_accept:  { label: "친구 수락", color: "#059669", bg: "#f0fdf4",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
  project_join:   { label: "팀원 참가", color: ACCENT, bg: "#eff6ff",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  file_upload:    { label: "파일 업로드", color: "#d97706", bg: "#fffbeb",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> },
  ai_kickoff:     { label: "킥오프 완료", color: ACCENT, bg: "#eff6ff",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  ai_organize:    { label: "내용 정리", color: "#0891b2", bg: "#ecfeff",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  ai_journal:     { label: "팀 일지", color: "#059669", bg: "#f0fdf4",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  ai_minutes:     { label: "회의록", color: "#7c3aed", bg: "#f5f3ff",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
};

function NotifItem({ n, onMarkRead, onDelete }) {
  const meta = TYPE_META[n.type] ?? { label: "알림", color: "#6b7280", bg: "#f9fafb",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> };

  return (
    <div
      className="group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors"
      style={{ backgroundColor: n.is_read ? "transparent" : "rgba(37,99,235,0.04)" }}
      onClick={() => !n.is_read && onMarkRead(n.id)}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.05)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.is_read ? "transparent" : "rgba(37,99,235,0.04)"; }}
    >
      {/* 아이콘 */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: meta.bg, color: meta.color }}>
        {meta.icon}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: meta.bg, color: meta.color }}>
            {meta.label}
          </span>
          {!n.is_read && (
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ACCENT }} />
          )}
        </div>
        <p className="text-sm font-semibold text-gray-800 leading-snug">{n.title}</p>
        {n.body && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>}
        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 mt-0.5"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

export default function NotificationsTab({ userId, accentColor, onUnreadChange }) {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  // API 라우트 대신 브라우저 Supabase 클라이언트로 직접 조회
  // (API 라우트는 anon key라 SELECT RLS가 차단함 — 브라우저엔 로그인 JWT 있음)
  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);
    const list = Array.isArray(data) ? data : [];
    setNotifs(list);
    onUnreadChange?.(list.filter((n) => !n.is_read).length);
    setLoading(false);
  }, [userId, onUnreadChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 리얼타임 구독
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notifs-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifs((prev) => [payload.new, ...prev]);
          onUnreadChange?.((c) => (typeof c === "number" ? c + 1 : 1));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, onUnreadChange]);

  const handleMarkRead = useCallback(async (id) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    onUnreadChange?.((c) => Math.max(0, (typeof c === "number" ? c : 1) - 1));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId);
  }, [userId, onUnreadChange]);

  const handleMarkAllRead = useCallback(async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onUnreadChange?.(0);
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
  }, [userId, onUnreadChange]);

  const handleDelete = useCallback(async (id) => {
    const n = notifs.find((x) => x.id === id);
    setNotifs((prev) => prev.filter((x) => x.id !== id));
    if (n && !n.is_read) onUnreadChange?.((c) => Math.max(0, (typeof c === "number" ? c : 1) - 1));
    await supabase.from("notifications").delete().eq("id", id).eq("user_id", userId);
  }, [userId, notifs, onUnreadChange]);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b flex items-center justify-between shrink-0"
        style={{ borderColor: "rgba(37,99,235,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-gray-900">알림</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(37,99,235,0.06)", color: ACCENT }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">알림이 없습니다</p>
            <p className="text-xs text-gray-400">친구 요청, 팀원 참가, AI 결과 등<br/>새 소식이 생기면 여기 표시됩니다.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(37,99,235,0.05)" }}>
            {notifs.map((n) => (
              <NotifItem key={n.id} n={n} onMarkRead={handleMarkRead} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

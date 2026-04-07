"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#2563eb";

function timeAgo(iso) {
  const d = new Date(iso), now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}
function formatTime(iso) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// ── 아이콘 ────────────────────────────────────────────────
const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const EmptyDmIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const NoConvIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// ── 대화 목록 ────────────────────────────────────────────
function ThreadList({ threads, selectedId, onSelect, myUserId }) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <NoConvIcon />
        <p className="text-sm font-semibold text-gray-500">개인 메시지 없음</p>
        <p className="text-xs text-gray-400 leading-relaxed">팀플 방에서 팀원 프로필을<br/>눌러 DM을 시작해보세요.</p>
      </div>
    );
  }
  return (
    <div className="divide-y" style={{ borderColor: "rgba(37,99,235,0.06)" }}>
      {threads.map((t) => {
        const active = t.partnerId === selectedId;
        return (
          <button key={t.partnerId} onClick={() => onSelect(t)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
            style={{ backgroundColor: active ? "rgba(37,99,235,0.07)" : "transparent" }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.03)"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            {/* 아바타 */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
              {t.partnerName[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-sm font-semibold text-gray-800 truncate">{t.partnerName}</p>
                <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(t.lastMessage.created_at)}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs text-gray-500 truncate">
                  {t.lastMessage.sender_id === myUserId ? "나: " : ""}{t.lastMessage.content}
                </p>
                {t.unread > 0 && (
                  <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold text-white flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
                    {t.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── 메시지 뷰 ────────────────────────────────────────────
function MessageView({ thread, myUserId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/dm/${thread.partnerId}?userId=${myUserId}`);
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  }, [thread.partnerId, myUserId]);

  // 읽음 처리
  const markRead = useCallback(async () => {
    await fetch(`/api/dm/${thread.partnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: myUserId }),
    });
  }, [thread.partnerId, myUserId]);

  useEffect(() => {
    fetchMessages().then(() => markRead());
    inputRef.current?.focus();

    // Realtime 구독
    const channel = supabase.channel(`dm-${myUserId}-${thread.partnerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const m = payload.new;
        const isRelevant =
          (m.sender_id === myUserId && m.recipient_id === thread.partnerId) ||
          (m.sender_id === thread.partnerId && m.recipient_id === myUserId);
        if (isRelevant) {
          setMessages((prev) => [...prev, m]);
          if (m.sender_id === thread.partnerId) markRead();
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [thread.partnerId, myUserId, fetchMessages, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: myUserId, recipient_id: thread.partnerId, content }),
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: "rgba(37,99,235,0.08)", background: "white" }}>
        <button onClick={onBack}
          className="btn-jelly w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors sm:hidden">
          <BackIcon />
        </button>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
          {thread.partnerName[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{thread.partnerName}</p>
          <p className="text-xs text-gray-400">개인 메시지</p>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor: "#f8faff" }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <EmptyDmIcon />
            <p className="text-sm text-gray-400">{thread.partnerName}님과 대화를 시작해보세요.</p>
          </div>
        )}
        {messages.map((m) => {
          const isMine = m.sender_id === myUserId;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`flex items-end gap-1.5 max-w-[75%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                {!isMine && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mb-0.5"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
                    {thread.partnerName[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <div className="px-3.5 py-2.5 text-sm leading-relaxed"
                    style={isMine
                      ? { background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, color: "white", borderRadius: "18px 18px 4px 18px", boxShadow: "0 3px 12px rgba(37,99,235,0.3)" }
                      : { backgroundColor: "white", color: "#1e293b", borderRadius: "18px 18px 18px 4px", border: "1px solid rgba(37,99,235,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
                    }>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  </div>
                  <p className={`text-xs text-gray-300 mt-1 ${isMine ? "text-right" : "text-left"}`}>{formatTime(m.created_at)}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <form onSubmit={handleSend}
        className="shrink-0 flex gap-2.5 px-4 py-4 bg-white border-t"
        style={{ borderColor: "rgba(37,99,235,0.08)" }}>
        <input
          ref={inputRef}
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm border outline-none"
          style={{ borderColor: "rgba(37,99,235,0.15)", backgroundColor: "#f8faff" }}
          placeholder={`${thread.partnerName}님에게 메시지...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button type="submit" disabled={!input.trim() || sending}
          className="btn-jelly w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 shrink-0"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow: `0 3px 12px rgba(37,99,235,0.35)` }}>
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

// ── 메인 탭 ─────────────────────────────────────────────
export default function MessagesTab({ userId, initialPartnerId, initialPartnerName }) {
  const [threads, setThreads]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null); // { partnerId, partnerName, lastMessage, unread }

  const fetchThreads = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/dm?userId=${userId}`);
    const data = await res.json();
    if (Array.isArray(data)) setThreads(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // 외부에서 특정 파트너로 바로 열기 (project page → home)
  useEffect(() => {
    if (!initialPartnerId || loading) return;
    const existing = threads.find((t) => t.partnerId === initialPartnerId);
    if (existing) {
      setSelected(existing);
    } else {
      // 아직 대화가 없어도 새 대화 열기
      setSelected({ partnerId: initialPartnerId, partnerName: initialPartnerName ?? "팀원", unread: 0, lastMessage: { content: "", created_at: new Date().toISOString(), sender_id: userId } });
    }
  }, [initialPartnerId, initialPartnerName, loading, threads, userId]);

  // Realtime — 새 DM이 오면 목록 갱신
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`dm-inbox-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const m = payload.new;
        if (m.sender_id === userId || m.recipient_id === userId) fetchThreads();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, fetchThreads]);

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  // 모바일: 목록 or 대화 한 번에 하나씩
  // 데스크탑: 좌우 분리

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* 좌측 목록 */}
      <div
        className={`flex flex-col border-r bg-white ${selected ? "hidden sm:flex" : "flex"}`}
        style={{ width: "280px", minWidth: "280px", borderColor: "rgba(37,99,235,0.08)" }}
      >
        {/* 헤더 */}
        <div className="shrink-0 px-4 py-4 border-b" style={{ borderColor: "rgba(37,99,235,0.08)" }}>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-800">개인 메시지</h2>
            {totalUnread > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>{totalUnread}</span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ThreadList
            threads={threads}
            selectedId={selected?.partnerId}
            onSelect={setSelected}
            myUserId={userId}
          />
        </div>
      </div>

      {/* 우측 대화 */}
      <div className={`flex-1 overflow-hidden ${selected ? "flex" : "hidden sm:flex"} flex-col`}>
        {selected ? (
          <MessageView
            key={selected.partnerId}
            thread={selected}
            myUserId={userId}
            onBack={() => setSelected(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <EmptyDmIcon />
            <p className="text-sm font-semibold text-gray-500">대화를 선택하세요</p>
            <p className="text-xs text-gray-400">팀플 방 → 팀원 프로필 → 개인 메시지</p>
          </div>
        )}
      </div>
    </div>
  );
}

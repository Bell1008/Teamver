"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#2563eb";
const MAX_FILE_MB = 10;

/* ── 유틸 ──────────────────────────────────────────────── */
function timeAgo(iso) {
  const d = new Date(iso), now = new Date(), diff = (now - d) / 1000;
  if (diff < 60)    return "방금";
  if (diff < 3600)  return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}
function formatTime(iso) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}
function formatBytes(n) {
  if (!n) return "";
  if (n < 1024)       return `${n}B`;
  if (n < 1048576)    return `${(n/1024).toFixed(1)}KB`;
  return `${(n/1048576).toFixed(1)}MB`;
}
function isImage(type) { return type?.startsWith("image/"); }

/* ── 아이콘 ────────────────────────────────────────────── */
const SendIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const BackIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
const ClipIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
const FileIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const DlIcon  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

/* ── 파트너 프로필 모달 ─────────────────────────────────── */
function PartnerProfileModal({ partnerId, myUserId, onClose }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch(`/api/dm/${partnerId}/profile?userId=${myUserId}`)
      .then((r) => r.json()).then(setInfo);
  }, [partnerId, myUserId]);

  if (!info) return (
    <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin"/>
    </div>
  );

  // 팀플 이름 우선, 없으면 계정 username
  const displayName = formatMemberNames(info.memberNames) || info.username || "알 수 없음";
  const showUsername = info.username && info.username !== "알 수 없음" && info.username !== displayName;

  return (
    <div className="absolute inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white">
        {/* 헤더 */}
        <div className="px-5 pt-6 pb-5 relative" style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
          <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white" style={{ background: "rgba(255,255,255,0.2)", backdropFilter:"blur(4px)" }}>
              {displayName[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-white font-bold text-base">{displayName}</p>
              {showUsername && (
                <p className="text-white/60 text-xs mt-0.5">@{info.username}</p>
              )}
            </div>
          </div>
        </div>

        {/* 바디 */}
        <div className="px-5 py-4 space-y-4">
          {/* 첫 연락 */}
          {info.firstContactAt && (
            <div className="flex items-center gap-2.5 text-xs text-gray-500">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>첫 연락: {new Date(info.firstContactAt).toLocaleDateString("ko-KR", { year:"numeric", month:"long", day:"numeric" })}</span>
            </div>
          )}

          {/* 함께한 팀플 */}
          {info.sharedProjects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">함께한 팀플</p>
              <div className="space-y-2">
                {info.sharedProjects.map((p) => (
                  <div key={p.projectId} className="px-3 py-2.5 rounded-xl" style={{ backgroundColor:"rgba(37,99,235,0.04)", border:"1px solid rgba(37,99,235,0.1)" }}>
                    <p className="text-sm font-semibold text-gray-800">{p.projectTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      나: <span className="font-medium text-gray-600">{p.myName || "—"}</span>
                      <span className="mx-1.5">·</span>
                      상대: <span className="font-medium text-gray-600">{p.theirName || "—"}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {info.sharedProjects.length === 0 && !info.firstContactAt && (
            <p className="text-sm text-gray-400 text-center py-2">공유된 팀플이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 대화 목록 아이템 ───────────────────────────────────── */
// 팀플 이름 목록 포맷 — 중복 제거 후 콤마 연결
function formatMemberNames(names) {
  const unique = [...new Set((names ?? []).filter(Boolean))];
  if (!unique.length) return "";
  return unique.join(", ");
}

function ThreadItem({ t, active, onSelect, onClose, myUserId }) {
  const lastText = t.lastMessage.file_name
    ? `파일: ${t.lastMessage.file_name}`
    : t.lastMessage.content;
  // 팀플명 우선, 없으면 username
  const memberDisplay = formatMemberNames(t.memberNames);
  const displayName = memberDisplay || t.username || "알 수 없음";

  return (
    <div
      className="group relative flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors"
      style={{ backgroundColor: active ? "rgba(37,99,235,0.07)" : "transparent" }}
      onClick={() => onSelect(t)}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.03)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {/* 아바타 */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow:"0 2px 8px rgba(37,99,235,0.25)" }}>
        {displayName[0]?.toUpperCase() ?? "?"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-800 truncate">{displayName}</span>
          </div>
          <span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(t.lastMessage.created_at)}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs text-gray-500 truncate">
            {t.lastMessage.sender_id === myUserId ? "나: " : ""}{lastText}
          </p>
          {t.unread > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold text-white flex items-center justify-center"
              style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
              {t.unread}
            </span>
          )}
        </div>
      </div>

      {/* X 닫기 버튼 */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(t.partnerId); }}
        className="absolute right-2 top-2 w-5 h-5 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
        title="대화 숨기기"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

/* ── 메시지 버블 ────────────────────────────────────────── */
function MsgBubble({ m, isMine, partnerInitial }) {
  const hasFile = !!m.file_url;
  const imgFile = hasFile && isImage(m.file_type);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-end gap-1.5 max-w-[75%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
        {!isMine && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mb-0.5"
            style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
            {partnerInitial}
          </div>
        )}
        <div>
          {imgFile ? (
            <a href={m.file_url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.file_url} alt={m.file_name} className="rounded-2xl max-w-[220px] max-h-[220px] object-cover" style={{ boxShadow:"0 2px 12px rgba(0,0,0,0.15)" }}/>
            </a>
          ) : hasFile ? (
            <a href={m.file_url} target="_blank" rel="noreferrer" download={m.file_name}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl no-underline"
              style={isMine
                ? { background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, color:"white", borderRadius:"18px 18px 4px 18px" }
                : { backgroundColor:"white", color:"#1e293b", borderRadius:"18px 18px 18px 4px", border:"1px solid rgba(37,99,235,0.1)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isMine ? "rgba(255,255,255,0.2)" : "rgba(37,99,235,0.08)" }}>
                <FileIcon />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate max-w-[130px]">{m.file_name}</p>
                <p className="text-xs opacity-60">{formatBytes(m.file_size)}</p>
              </div>
              <DlIcon />
            </a>
          ) : (
            <div className="px-3.5 py-2.5 text-sm leading-relaxed"
              style={isMine
                ? { background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, color:"white", borderRadius:"18px 18px 4px 18px", boxShadow:"0 3px 12px rgba(37,99,235,0.3)" }
                : { backgroundColor:"white", color:"#1e293b", borderRadius:"18px 18px 18px 4px", border:"1px solid rgba(37,99,235,0.08)", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            </div>
          )}
          <p className={`text-xs text-gray-300 mt-1 ${isMine ? "text-right" : "text-left"}`}>{formatTime(m.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

/* ── 메시지 뷰 ──────────────────────────────────────────── */
function MessageView({ thread, myUserId, onBack }) {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [sending, setSending]         = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileRef   = useRef(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/dm/${thread.partnerId}?userId=${myUserId}`);
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  }, [thread.partnerId, myUserId]);

  const markRead = useCallback(async () => {
    await fetch(`/api/dm/${thread.partnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: myUserId }),
    });
  }, [thread.partnerId, myUserId]);

  useEffect(() => {
    fetchMessages().then(markRead);
    inputRef.current?.focus();

    const channel = supabase.channel(`dm-view-${myUserId}-${thread.partnerId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const m = payload.new;
        const ok = (m.sender_id === myUserId && m.recipient_id === thread.partnerId)
                || (m.sender_id === thread.partnerId && m.recipient_id === myUserId);
        if (ok) {
          // 이미 optimistic update로 추가된 메시지 중복 방지
          setMessages((prev) => prev.some((p) => p.id === m.id) ? prev : [...prev.filter((p) => !p.id.startsWith("tmp-") || p.sender_id !== m.sender_id), m]);
          if (m.sender_id === thread.partnerId) markRead();
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [thread.partnerId, myUserId, fetchMessages, markRead]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* 파일 업로드 */
  const handleFile = async (file) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) { alert(`${MAX_FILE_MB}MB 이하 파일만 가능합니다.`); return; }
    setUploading(true);
    try {
      const ext  = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
      const uid  = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const path = `dm/${myUserId}/${uid}.${ext}`;
      const { error: upErr } = await supabase.storage.from("teamver").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("teamver").getPublicUrl(path);
      await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: myUserId, recipient_id: thread.partnerId,
          content: file.name,
          file_url: publicUrl, file_name: file.name, file_type: file.type, file_size: file.size,
        }),
      });
    } catch (e) { alert("파일 전송 실패: " + e.message); }
    finally { setUploading(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    // optimistic update — realtime이 늦거나 꺼진 경우에도 즉시 표시
    const tempMsg = { id: `tmp-${Date.now()}`, sender_id: myUserId, recipient_id: thread.partnerId, content, created_at: new Date().toISOString(), read: false };
    setMessages((prev) => [...prev, tempMsg]);
    try {
      const res = await fetch("/api/dm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: myUserId, recipient_id: thread.partnerId, content }),
      });
      // 서버 저장 성공 시 실제 메시지로 교체 (id 동기화)
      if (res.ok) {
        const saved = await res.json();
        if (saved?.id) setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? saved : m));
      }
    } catch { /* 실패해도 임시 메시지는 유지 */ }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  // 팀플명 우선 표시
  const threadDisplayName = formatMemberNames(thread.memberNames) || thread.username || "알 수 없음";
  const partnerInitial = threadDisplayName[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col h-full relative">
      {/* 파트너 프로필 모달 */}
      {showProfile && (
        <PartnerProfileModal partnerId={thread.partnerId} myUserId={myUserId} onClose={() => setShowProfile(false)} />
      )}

      {/* 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b bg-white" style={{ borderColor:"rgba(37,99,235,0.08)" }}>
        <button onClick={onBack} className="btn-jelly w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors sm:hidden">
          <BackIcon />
        </button>
        {/* 클릭 가능한 프로필 영역 */}
        <button onClick={() => setShowProfile(true)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>
            {partnerInitial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 leading-tight">{threadDisplayName}</p>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" className="shrink-0">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ backgroundColor:"#f8faff" }}>
        {messages.length === 0 && !uploading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-sm text-gray-400">{threadDisplayName}님과 대화를 시작해보세요.</p>
          </div>
        )}
        {messages.map((m) => (
          <MsgBubble key={m.id} m={m} isMine={m.sender_id === myUserId} partnerInitial={partnerInitial} />
        ))}
        {uploading && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs text-white" style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, borderRadius:"18px 18px 4px 18px" }}>
              <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin"/>
              전송 중...
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* 입력 */}
      <form onSubmit={handleSend} className="shrink-0 flex items-center gap-2 px-3 py-3 bg-white border-t" style={{ borderColor:"rgba(37,99,235,0.08)" }}>
        {/* 파일 첨부 */}
        <input type="file" ref={fileRef} className="hidden" accept="image/*,.pdf,.doc,.docx,.hwp,.ppt,.pptx,.xls,.xlsx,.txt,.md,.zip"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }}/>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="btn-jelly w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors shrink-0 disabled:opacity-40">
          <ClipIcon />
        </button>
        <textarea ref={inputRef}
          rows={1}
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm border outline-none resize-none overflow-hidden"
          style={{ borderColor:"rgba(37,99,235,0.15)", backgroundColor:"#f8faff", lineHeight:"1.5", maxHeight:"100px", overflowY:"auto" }}
          placeholder={`${threadDisplayName}님에게 메시지... (Shift+Enter 줄바꿈)`}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim() && !sending && !uploading) handleSend(e);
            }
          }}
          disabled={sending || uploading}
        />
        <button type="submit" disabled={!input.trim() || sending || uploading}
          className="btn-jelly w-10 h-10 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 shrink-0"
          style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow:`0 3px 12px rgba(37,99,235,0.35)` }}>
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

/* ── 공통: 유저 아바타 ─────────────────────────────────── */
function Avatar({ name, gradient, size = 9 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0`}
      style={{ background: gradient ?? `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow:"0 2px 8px rgba(37,99,235,0.2)" }}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

/* ── 공통: 아이템 행 호버 래퍼 ─────────────────────────── */
function ItemRow({ children, onClick }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150"
      style={{ borderBottom:"1px solid rgba(37,99,235,0.06)" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(37,99,235,0.04)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}
      onClick={onClick}>
      {children}
    </div>
  );
}

/* ── 친구 목록 아이템 ─────────────────────────────────── */
function FriendItem({ friend, onStartDm, onViewProfile }) {
  const displayName = formatMemberNames(friend.memberNames) || friend.username;
  return (
    <ItemRow onClick={() => onViewProfile?.(friend.id)}>
      <Avatar name={displayName} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
        {formatMemberNames(friend.memberNames) && friend.username && (
          <p className="text-xs text-gray-400 truncate">@{friend.username}</p>
        )}
      </div>
      <button onClick={(e) => { e.stopPropagation(); onStartDm(friend); }}
        className="btn-jelly shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
        style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow:"0 2px 8px rgba(37,99,235,0.22)" }}>
        메시지
      </button>
    </ItemRow>
  );
}

/* ── 친구 요청 아이템 ─────────────────────────────────── */
function RequestItem({ req, type, onAction, onViewProfile }) {
  const displayName = formatMemberNames(req.memberNames) || req.username;
  const profileId = type === "received" ? req.sender_id : req.recipient_id;
  return (
    <ItemRow onClick={() => onViewProfile?.(profileId)}>
      <Avatar name={displayName} gradient="linear-gradient(135deg, #94a3b8, #64748b)" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
        <p className="text-xs text-gray-400">{type === "received" ? "친구 요청을 보냈어요" : "요청 보냄"}</p>
      </div>
      {type === "received" ? (
        <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onAction(req.id, "accept")}
            className="btn-jelly px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>수락</button>
          <button onClick={() => onAction(req.id, "reject")}
            className="btn-jelly px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">거절</button>
        </div>
      ) : (
        <button onClick={(e) => { e.stopPropagation(); onAction(req.id, "cancel"); }}
          className="btn-jelly shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">취소</button>
      )}
    </ItemRow>
  );
}

/* ── 검색 결과 아이템 ─────────────────────────────────── */
function SearchResultItem({ user, onSendRequest, onAction }) {
  const displayName = formatMemberNames(user.memberNames) || user.username;
  let actionButton;
  if (user.relation === "none") {
    actionButton = (
      <button onClick={() => onSendRequest(user.id)}
        className="btn-jelly shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white"
        style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>요청</button>
    );
  } else if (user.relation === "pending_sent") {
    actionButton = (
      <button onClick={() => onAction(user.requestId, "cancel")}
        className="btn-jelly shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">취소</button>
    );
  } else if (user.relation === "pending_received") {
    actionButton = (
      <div className="flex gap-1.5 shrink-0">
        <button onClick={() => onAction(user.requestId, "accept")}
          className="btn-jelly px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white"
          style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>수락</button>
        <button onClick={() => onAction(user.requestId, "reject")}
          className="btn-jelly px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200">거절</button>
      </div>
    );
  } else {
    actionButton = <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-lg text-blue-500 bg-blue-50">친구</span>;
  }
  return (
    <ItemRow>
      <Avatar name={displayName} gradient="linear-gradient(135deg, #94a3b8, #64748b)" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
        {user.memberNames?.length > 0 && <p className="text-xs text-gray-400 truncate">@{user.username}</p>}
      </div>
      <div onClick={(e) => e.stopPropagation()}>{actionButton}</div>
    </ItemRow>
  );
}

/* ── 친구 패널 ────────────────────────────────────────── */
function FriendsPanel({ userId, onStartDm, myUserId }) {
  const [subTab, setSubTab]               = useState("list");
  const [friends, setFriends]             = useState([]);
  const [requests, setRequests]           = useState({ received: [], sent: [] });
  const [searchQ, setSearchQ]             = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);
  const [loading, setLoading]             = useState(true);
  const [profilePartnerId, setProfilePartnerId] = useState(null);
  const searchTimerRef                    = useRef(null);

  const fetchFriends = useCallback(async () => {
    const res = await fetch(`/api/friends?userId=${userId}`);
    const data = await res.json();
    if (Array.isArray(data)) setFriends(data);
  }, [userId]);

  const fetchRequests = useCallback(async () => {
    const res = await fetch(`/api/friends/requests?userId=${userId}`);
    const data = await res.json();
    if (data.received !== undefined) setRequests(data);
  }, [userId]);

  useEffect(() => {
    Promise.all([fetchFriends(), fetchRequests()]).finally(() => setLoading(false));
  }, [fetchFriends, fetchRequests]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(`friends-panel-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friend_requests" }, () => {
        fetchFriends(); fetchRequests();
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId, fetchFriends, fetchRequests]);

  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    if (!searchQ.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQ)}&userId=${userId}`);
        const data = await res.json();
        if (Array.isArray(data)) setSearchResults(data);
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQ, userId]);

  const sendRequest = async (recipientId) => {
    const res = await fetch("/api/friends", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: userId, recipientId }),
    });
    if (res.ok) {
      setSearchResults((prev) => prev.map((u) => u.id === recipientId ? { ...u, relation: "pending_sent" } : u));
      fetchRequests();
    }
  };

  const handleAction = async (requestId, action) => {
    const res = await fetch(`/api/friends/requests/${requestId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      await Promise.all([fetchFriends(), fetchRequests()]);
      setSearchResults((prev) => prev.map((u) =>
        u.requestId === requestId
          ? { ...u, relation: action === "accept" ? "accepted" : "none", requestId: undefined }
          : u
      ));
    }
  };

  const receivedCount = requests.received?.length ?? 0;
  const BD = "1px solid rgba(37,99,235,0.08)";

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-blue-100 border-t-blue-400 animate-spin"/>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* 프로필 팝업 */}
      {profilePartnerId && (
        <PartnerProfileModal partnerId={profilePartnerId} myUserId={myUserId} onClose={() => setProfilePartnerId(null)} />
      )}

      {/* 서브 탭 */}
      <div className="shrink-0 flex" style={{ borderBottom: BD }}>
        {[
          { key:"list",     label:`친구목록`, count: friends.length },
          { key:"requests", label:"요청",     badge: receivedCount },
        ].map(({ key, label, count, badge }) => (
          <button key={key} onClick={() => setSubTab(key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${subTab === key ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
            {label}
            {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
            {badge > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full"
                style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === "list" ? (
        <div className="flex-1 overflow-y-auto">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6 py-10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p className="text-sm font-semibold text-gray-500">친구가 없습니다</p>
              <p className="text-xs text-gray-400 leading-relaxed">요청 탭에서 유저를 검색해<br/>친구 요청을 보내보세요.</p>
            </div>
          ) : (
            friends.map((f) => (
              <FriendItem key={f.id} friend={f} onStartDm={onStartDm} onViewProfile={setProfilePartnerId} />
            ))
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 검색창 */}
          <div className="shrink-0 px-3 py-2.5" style={{ borderBottom: BD }}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border outline-none"
                style={{ borderColor:"rgba(37,99,235,0.15)", backgroundColor:"#f8faff" }}
                placeholder="유저명으로 검색..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
              {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-blue-200 border-t-blue-500 animate-spin"/>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchQ.trim() ? (
              searchResults.length === 0 && !searching ? (
                <p className="text-xs text-gray-400 text-center py-8">검색 결과 없음</p>
              ) : (
                searchResults.map((u) => (
                  <SearchResultItem key={u.id} user={u} onSendRequest={sendRequest} onAction={handleAction} />
                ))
              )
            ) : (
              <>
                {receivedCount > 0 && (
                  <>
                    <div className="px-4 py-1.5 bg-gray-50" style={{ borderBottom: BD }}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">받은 요청</p>
                    </div>
                    {requests.received.map((r) => (
                      <RequestItem key={r.id} req={r} type="received" onAction={handleAction} onViewProfile={setProfilePartnerId} />
                    ))}
                  </>
                )}
                {(requests.sent?.length ?? 0) > 0 && (
                  <>
                    <div className="px-4 py-1.5 bg-gray-50" style={{ borderBottom: BD }}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">보낸 요청</p>
                    </div>
                    {requests.sent.map((r) => (
                      <RequestItem key={r.id} req={r} type="sent" onAction={handleAction} onViewProfile={setProfilePartnerId} />
                    ))}
                  </>
                )}
                {receivedCount === 0 && (requests.sent?.length ?? 0) === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                    </svg>
                    <p className="text-sm font-semibold text-gray-500">요청 없음</p>
                    <p className="text-xs text-gray-400">검색창으로 유저를 찾아<br/>친구 요청을 보낼 수 있습니다.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 메인 탭 ────────────────────────────────────────────── */
export default function MessagesTab({ userId, initialPartnerId, initialPartnerName, onUnreadChange }) {
  const [mainTab, setMainTab]      = useState("messages"); // "messages" | "friends"
  const [threads, setThreads]      = useState([]);
  const [hidden, setHidden]        = useState(new Set()); // 닫기로 숨긴 대화
  const [loading, setLoading]      = useState(true);
  const [selected, setSelected]    = useState(null);

  const fetchThreads = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/dm?userId=${userId}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setThreads(data);
      onUnreadChange?.(data.reduce((s, t) => s + t.unread, 0));
    }
    setLoading(false);
  }, [userId, onUnreadChange]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const handleStartDm = useCallback((friend) => {
    setMainTab("messages");
    const existing = threads.find((t) => t.partnerId === friend.id);
    setSelected(existing ?? {
      partnerId: friend.id,
      username: friend.username,
      memberNames: friend.memberNames ?? [],
      unread: 0,
      lastMessage: { content: "", created_at: new Date().toISOString(), sender_id: userId },
    });
    setHidden((h) => { const n = new Set(h); n.delete(friend.id); return n; });
  }, [threads, userId]);

  useEffect(() => {
    if (!initialPartnerId || loading) return;
    const existing = threads.find((t) => t.partnerId === initialPartnerId);
    setSelected(existing ?? { partnerId: initialPartnerId, username: initialPartnerName ?? "팀원", memberNames: initialPartnerName ? [initialPartnerName] : [], unread: 0, lastMessage: { content:"", created_at: new Date().toISOString(), sender_id: userId } });
    setHidden((h) => { const n = new Set(h); n.delete(initialPartnerId); return n; });
  }, [initialPartnerId, initialPartnerName, loading, threads, userId]);

  // Realtime
  useEffect(() => {
    if (!userId) return;
    const ch = supabase.channel(`dm-inbox-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const m = payload.new;
        if (m.sender_id === userId || m.recipient_id === userId) fetchThreads();
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId, fetchThreads]);

  const visible = threads.filter((t) => !hidden.has(t.partnerId));
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin"/>
    </div>
  );

  return (
    <div className="h-full flex overflow-hidden">
      {/* 좌측 목록 */}
      <div className={`flex flex-col border-r bg-white ${selected ? "hidden sm:flex" : "flex"}`}
        style={{ width:"280px", minWidth:"280px", borderColor:"rgba(37,99,235,0.08)" }}>
        {/* 메인 탭 헤더 */}
        <div className="shrink-0 flex border-b" style={{ borderColor:"rgba(37,99,235,0.08)" }}>
          <button onClick={() => setMainTab("messages")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${mainTab === "messages" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
            메시지
            {totalUnread > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                style={{ background:`linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>{totalUnread}</span>
            )}
          </button>
          <button onClick={() => setMainTab("friends")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${mainTab === "friends" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
            친구
          </button>
        </div>

        {mainTab === "messages" ? (
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor:"rgba(37,99,235,0.06)" }}>
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p className="text-sm font-semibold text-gray-500">메시지 없음</p>
                <p className="text-xs text-gray-400 leading-relaxed">친구 탭에서 친구를 추가하고<br/>대화를 시작해보세요.</p>
              </div>
            ) : visible.map((t) => (
              <ThreadItem key={t.partnerId} t={t} active={selected?.partnerId === t.partnerId}
                onSelect={(t) => { setSelected(t); setHidden((h) => { const n = new Set(h); n.delete(t.partnerId); return n; }); }}
                onClose={(pid) => { setHidden((h) => new Set([...h, pid])); if (selected?.partnerId === pid) setSelected(null); }}
                myUserId={userId}
              />
            ))}
          </div>
        ) : (
          <FriendsPanel userId={userId} myUserId={userId} onStartDm={handleStartDm} />
        )}
      </div>

      {/* 우측 대화 */}
      <div className={`flex-1 overflow-hidden ${selected ? "flex" : "hidden sm:flex"} flex-col`}>
        {selected ? (
          <MessageView key={selected.partnerId} thread={selected} myUserId={userId} onBack={() => setSelected(null)} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-sm font-semibold text-gray-500">대화를 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

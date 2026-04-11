"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useDialog } from "@/components/DialogProvider";
import AiResultModal from "@/components/AiResultModal";

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export default function ChatPanel({ projectId, myMemberId, myName, accentColor, isOpen, onClose, canUseAI }) {
  const dialog = useDialog();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(null); // "summary" | "minutes" | null
  const [aiModal, setAiModal] = useState(null); // { title, text, badge }
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/messages`);
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();
    inputRef.current?.focus();

    const channel = supabase
      .channel(`chat-${projectId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isOpen, projectId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !myName) return;
    setSending(true);
    try {
      await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: myMemberId, member_name: myName, content: input.trim() }),
      });
      setInput("");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleAI = async (mode) => {
    setAiLoading(mode);
    try {
      const res = await fetch(`/api/projects/${projectId}/messages/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.error) { await dialog.alert(data.error); return; }
      // 결과 팝업으로 즉시 표시
      const isMinutes = mode === "minutes";
      setAiModal({
        title: isMinutes ? "회의록" : "AI 요약",
        badge: isMinutes ? "보관함에 저장됨" : "채팅에 기록됨 · 보관함에 저장됨",
        text: data.aiText ?? data.message?.content ?? "",
      });
    } finally {
      setAiLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* AI 결과 팝업 */}
      {aiModal && (
        <AiResultModal
          title={aiModal.title}
          text={aiModal.text}
          badge={aiModal.badge}
          onClose={() => setAiModal(null)}
        />
      )}

      {/* 오버레이 (모바일) */}
      <div
        className="fixed inset-0 bg-black/20 z-30 sm:hidden"
        onClick={onClose}
      />

      <div
        className="fixed inset-y-0 right-0 w-full sm:w-[360px] flex flex-col z-40 chat-enter"
        style={{
          backgroundColor: "#fff",
          borderLeft: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        }}
      >
        {/* 헤더 */}
        <div
          className="shrink-0 px-4 pt-4 pb-3"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
            boxShadow: `0 2px 16px ${accentColor}35`,
          }}
        >
          {/* 타이틀 행 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-semibold text-sm leading-tight">팀 채팅</p>
              <p className="text-white/55 text-xs mt-0.5">대화를 기록하고 AI로 요약하세요</p>
            </div>
            <button
              onClick={onClose}
              className="btn-jelly w-8 h-8 flex items-center justify-center rounded-xl text-white transition-all"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
            >
              <CloseIcon />
            </button>
          </div>

          {/* AI 버튼 행 */}
          <div className="flex gap-2">
            {[
              { mode: "summary", label: "AI 요약",  loadingLabel: "분석 중..." },
              { mode: "minutes", label: "회의록",   loadingLabel: "작성 중..." },
            ].map(({ mode, label, loadingLabel }) => (
              <button
                key={mode}
                onClick={() => canUseAI ? handleAI(mode) : null}
                disabled={!!aiLoading}
                title={canUseAI ? undefined : "관리자 권한이 필요합니다"}
                className="btn-jelly flex-1 py-2 rounded-xl text-xs font-semibold text-white whitespace-nowrap disabled:opacity-60 transition-all relative"
                style={{ backgroundColor: canUseAI ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)", backdropFilter: "blur(4px)", cursor: canUseAI ? "pointer" : "not-allowed" }}
                onMouseEnter={e => { if (canUseAI && !aiLoading) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.28)"; }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = canUseAI ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}
              >
                <span className={canUseAI ? "" : "opacity-50"}>
                  {aiLoading === mode ? loadingLabel : label}
                </span>
                {!canUseAI && (
                  <svg className="inline-block ml-1 opacity-60" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 메세지 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}12`, color: `${accentColor}80` }}
              >
                <ChatIcon />
              </div>
              <p className="text-sm text-gray-400">
                아직 대화가 없습니다.<br />
                팀원들과 회의를 시작해보세요.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.member_id === myMemberId;
            const isAI = msg.is_ai;

            if (isAI) {
              return (
                <div
                  key={msg.id}
                  className="rounded-xl p-3.5"
                  style={{
                    backgroundColor: `${accentColor}08`,
                    border: `1px solid ${accentColor}18`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div
                      className="w-5 h-5 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${accentColor}20` }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill={accentColor}>
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: accentColor }}>{msg.member_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{formatTime(msg.created_at)}</span>
                  </div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                {!isMine && (
                  <span className="text-xs text-gray-500 mb-1 ml-2 font-medium">{msg.member_name}</span>
                )}
                <div className={`flex items-end gap-1.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed btn-jelly"
                    style={
                      isMine
                        ? {
                            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                            color: "white",
                            borderRadius: "18px 18px 4px 18px",
                            boxShadow: `0 3px 12px ${accentColor}35`,
                          }
                        : {
                            backgroundColor: "#f0f4ff",
                            color: "#1e293b",
                            borderRadius: "18px 18px 18px 4px",
                            border: "1px solid rgba(37,99,235,0.08)",
                          }
                    }
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <span className="text-xs text-gray-300 shrink-0 pb-0.5">{formatTime(msg.created_at)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        {!myName ? (
          <div
            className="px-4 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#fafafa" }}
          >
            <p className="text-xs text-gray-400 text-center">참여 등록 후 채팅이 가능합니다.</p>
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            className="px-4 py-4 flex gap-2.5 shrink-0"
            style={{ borderTop: "1px solid rgba(37,99,235,0.08)" }}
          >
            <input
              ref={inputRef}
              className="input-drop flex-1 border rounded-2xl px-4 py-2.5 text-sm"
              style={{ borderColor: "rgba(37,99,235,0.15)", backgroundColor: "#f8faff" }}
              placeholder="메세지 입력..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-jelly w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, #1d4ed8)`,
                boxShadow: `0 3px 12px ${accentColor}40`,
              }}
            >
              <SendIcon />
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

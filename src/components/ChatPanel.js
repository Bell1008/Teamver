"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export default function ChatPanel({ projectId, myMemberId, myName, accentColor, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/messages`);
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();

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
    }
  };

  const handleAI = async (mode) => {
    setAiLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/messages/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
    } finally {
      setAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl flex flex-col z-40 border-l border-gray-200">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200" style={{ backgroundColor: accentColor }}>
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">팀 채팅</span>
          <span className="text-xs text-white/70">회의록 자동 생성</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAI("summary")}
            disabled={aiLoading}
            className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            {aiLoading ? "..." : "AI 요약"}
          </button>
          <button
            onClick={() => handleAI("minutes")}
            disabled={aiLoading}
            className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            {aiLoading ? "..." : "회의록"}
          </button>
          <button onClick={onClose} className="text-white/80 hover:text-white ml-1 text-lg leading-none">✕</button>
        </div>
      </div>

      {/* 메세지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400 text-center">
              아직 대화가 없습니다.<br />
              팀원들과 회의를 시작해보세요!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.member_id === myMemberId;
          const isAI = msg.is_ai;

          if (isAI) {
            return (
              <div key={msg.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs font-semibold" style={{ color: accentColor }}>{msg.member_name}</span>
                  <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                </div>
                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              {!isMine && (
                <span className="text-xs text-gray-500 mb-1 ml-1">{msg.member_name}</span>
              )}
              <div className="flex items-end gap-1.5" style={{ flexDirection: isMine ? "row-reverse" : "row" }}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isMine
                      ? "rounded-tr-sm text-white"
                      : "rounded-tl-sm bg-gray-100 text-gray-800"
                  }`}
                  style={isMine ? { backgroundColor: accentColor } : {}}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <span className="text-xs text-gray-300 shrink-0">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      {!myName ? (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">참여 등록 후 채팅이 가능합니다.</p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="px-3 py-3 border-t border-gray-200 flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": accentColor }}
            placeholder="메세지 입력..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-40 transition-colors"
            style={{ backgroundColor: accentColor }}
          >
            전송
          </button>
        </form>
      )}
    </div>
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";

const ACCENT = "#2563eb";

const DialogContext = createContext(null);

// ── 모달 렌더링 ──────────────────────────────────────────────
function DialogModal({ dialog, onConfirm, onCancel }) {
  const isConfirm = dialog.type === "confirm";
  const atype     = dialog.alertType ?? "error"; // "error" | "success" | "info" | "warning"

  const iconMap = {
    error:   { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)",   color: "#dc2626",  grad: "linear-gradient(135deg,#dc2626,#b91c1c)", icon: ErrIcon },
    warning: { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  color: "#b45309",  grad: "linear-gradient(135deg,#f59e0b,#d97706)", icon: WarnIcon },
    success: { bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.2)",  color: "#16a34a",  grad: "linear-gradient(135deg,#16a34a,#15803d)", icon: OkIcon },
    info:    { bg: "rgba(37,99,235,0.08)",  border: "rgba(37,99,235,0.18)",  color: ACCENT,     grad: `linear-gradient(135deg,${ACCENT},#1d4ed8)`, icon: InfoIcon },
  };

  const danger = dialog.danger ?? false;
  const confirmGrad = danger
    ? "linear-gradient(135deg,#dc2626,#b91c1c)"
    : `linear-gradient(135deg,${ACCENT},#1d4ed8)`;
  const confirmShadow = danger ? "0 4px 16px rgba(220,38,38,0.4)" : `0 4px 16px rgba(37,99,235,0.4)`;
  const ai = iconMap[atype];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "white", animation: "dlg-in 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
      >
        {/* 상단 아이콘 영역 */}
        <div className="flex flex-col items-center pt-7 pb-5 px-6">
          {isConfirm ? (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: danger ? "rgba(220,38,38,0.08)" : `rgba(37,99,235,0.08)` }}
            >
              {danger ? <DangerIcon color="#dc2626" /> : <ConfirmIcon color={ACCENT} />}
            </div>
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: ai.bg, border: `1.5px solid ${ai.border}` }}
            >
              <ai.icon color={ai.color} />
            </div>
          )}

          {/* 제목 */}
          {dialog.title && (
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">{dialog.title}</h3>
          )}

          {/* 메시지 */}
          <p className="text-sm text-gray-600 text-center leading-relaxed whitespace-pre-wrap">{dialog.message}</p>
        </div>

        {/* 버튼 영역 */}
        <div className="px-5 pb-5 flex gap-2.5">
          {isConfirm ? (
            <>
              <button
                onClick={onCancel}
                className="btn-jelly flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {dialog.cancelText ?? "취소"}
              </button>
              <button
                onClick={onConfirm}
                className="btn-jelly flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: confirmGrad, boxShadow: confirmShadow }}
              >
                {dialog.confirmText ?? "확인"}
              </button>
            </>
          ) : (
            <button
              onClick={onConfirm}
              className="btn-jelly flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: ai.grad, boxShadow: `0 4px 16px ${ai.color}40` }}
            >
              확인
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dlg-in {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Provider ─────────────────────────────────────────────────
export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const showConfirm = useCallback(
    (message, { title, confirmText, cancelText, danger } = {}) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setDialog({ type: "confirm", message, title, confirmText, cancelText, danger });
      }),
    []
  );

  const showAlert = useCallback(
    (message, { title, type } = {}) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setDialog({ type: "alert", message, title, alertType: type ?? "error" });
      }),
    []
  );

  const handleConfirm = useCallback(() => { resolveRef.current?.(true);  setDialog(null); }, []);
  const handleCancel  = useCallback(() => { resolveRef.current?.(false); setDialog(null); }, []);

  return (
    <DialogContext.Provider value={{ confirm: showConfirm, alert: showAlert }}>
      {children}
      {dialog && <DialogModal dialog={dialog} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </DialogContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within <DialogProvider>");
  return ctx;
}

// ── 아이콘들 ─────────────────────────────────────────────────
function ErrIcon({ color }) {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function WarnIcon({ color }) {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function OkIcon({ color }) {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>;
}
function InfoIcon({ color }) {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
}
function ConfirmIcon({ color }) {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function DangerIcon({ color }) {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
}

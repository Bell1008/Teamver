"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#2563eb";
const MAX_FREE_PLANNING = 3;
const MAX_SIZE_MB = 5;

const EXT_MAP = {
  pdf:  { label:"PDF",  bg:"#fee2e2", color:"#dc2626" },
  ppt:  { label:"PPT",  bg:"#ffedd5", color:"#ea580c" },
  pptx: { label:"PPT",  bg:"#ffedd5", color:"#ea580c" },
  doc:  { label:"DOC",  bg:"#dbeafe", color:"#2563eb" },
  docx: { label:"DOC",  bg:"#dbeafe", color:"#2563eb" },
  hwp:  { label:"HWP",  bg:"#dbeafe", color:"#1d4ed8" },
  xls:  { label:"XLS",  bg:"#dcfce7", color:"#16a34a" },
  xlsx: { label:"XLS",  bg:"#dcfce7", color:"#16a34a" },
  md:   { label:"MD",   bg:"#f1f5f9", color:"#475569" },
  txt:  { label:"TXT",  bg:"#f1f5f9", color:"#64748b" },
  png:  { label:"IMG",  bg:"#d1fae5", color:"#059669" },
  jpg:  { label:"IMG",  bg:"#d1fae5", color:"#059669" },
  jpeg: { label:"IMG",  bg:"#d1fae5", color:"#059669" },
};

function getFileInfo(name = "", mime = "") {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  if (EXT_MAP[ext]) return EXT_MAP[ext];
  if (mime.startsWith("image/")) return EXT_MAP["png"];
  if (mime.includes("pdf")) return EXT_MAP["pdf"];
  if (mime.includes("word")) return EXT_MAP["doc"];
  if (mime.includes("presentation") || mime.includes("powerpoint")) return EXT_MAP["ppt"];
  return { label:"FILE", bg:"#f1f5f9", color:"#64748b" };
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

export default function PlanningDocs({ projectId, memberId, memberName, canUpload }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [desc, setDesc] = useState("");
  const [showPremium, setShowPremium] = useState(false);
  const [premiumMsg, setPremiumMsg] = useState("");

  const fetchDocs = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files?category=planning`);
    const data = await res.json();
    if (Array.isArray(data)) setDocs(data);
  }, [projectId]);

  useEffect(() => {
    fetchDocs();
    const ch = supabase.channel(`planning-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_files", filter: `project_id=eq.${projectId}` }, fetchDocs)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [projectId, fetchDocs]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
      return;
    }

    setUploading(true);
    try {
      // UUID 기반 경로 — 한글·특수문자 포함 파일명도 안전하게 업로드
      const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const storagePath = `${projectId}/planning/${uid}${ext ? "." + ext : ""}`;

      const { error: storErr } = await supabase.storage.from("teamver").upload(storagePath, file);
      if (storErr) throw storErr;

      const { data: { publicUrl } } = supabase.storage.from("teamver").getPublicUrl(storagePath);

      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, member_name: memberName, name: file.name, url: publicUrl, storage_path: storagePath, size: file.size, mime_type: file.type, category: "planning", description: desc.trim() || null }),
      });
      const data = await res.json();
      if (res.status === 402) { setPremiumMsg(data.error); setShowPremium(true); return; }
      if (!res.ok) throw new Error(data.error);
      setDesc("");
      fetchDocs();
    } catch (err) {
      alert("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm("이 기획안을 삭제하시겠습니까?")) return;
    await fetch(`/api/files/${docId}`, { method: "DELETE" });
    fetchDocs();
  };

  return (
    <section className="rounded-2xl p-5"
      style={{ background:"white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 4px 24px rgba(37,99,235,0.08), 0 1px 4px rgba(37,99,235,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${ACCENT}, #1d4ed8)` }}/>
          <div>
            <h2 className="font-semibold text-gray-800">기획안 저장소</h2>
            <p className="text-xs text-gray-400 mt-0.5">AI 킥오프 시 자동으로 참고합니다 · 무료 {MAX_FREE_PLANNING}개</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(37,99,235,0.08)", color: ACCENT }}>{docs.length}/{MAX_FREE_PLANNING}</span>
      </div>

      {/* 문서 목록 */}
      <div className="space-y-1.5 mb-3">
        {docs.length === 0 && (
          <p className="text-xs text-gray-300 text-center py-4">기획안을 올려주세요.</p>
        )}
        {docs.map((doc) => {
          const info = getFileInfo(doc.name, doc.mime_type ?? "");
          return (
            <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all"
              style={{ backgroundColor: "rgba(248,250,255,0.8)", border: "1px solid rgba(37,99,235,0.07)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
                style={{ backgroundColor: info.bg, color: info.color }}>
                {info.label}
              </div>
              <div className="flex-1 min-w-0">
                <a href={doc.url} target="_blank" rel="noreferrer"
                  className="text-sm font-semibold text-gray-800 hover:text-blue-600 truncate block transition-colors leading-tight">
                  {doc.name}
                </a>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {[doc.description, formatSize(doc.size), doc.member_name].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer"
                  className="btn-jelly w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                  style={{ backgroundColor: "rgba(37,99,235,0.08)", color: ACCENT }} title="다운로드">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </a>
                {canUpload && (
                  <button onClick={() => handleDelete(doc.id)}
                    className="btn-jelly w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 transition-colors"
                    title="삭제">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 업로드 영역 */}
      {canUpload && (
        <div className="space-y-2">
          <input
            className="input-drop w-full border border-blue-100 rounded-xl px-3 py-2 text-xs"
            placeholder="기획안 설명 (선택, AI가 참고)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <label className={`btn-jelly flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}
            style={{ backgroundColor: "rgba(37,99,235,0.07)", color: ACCENT, border: "1.5px dashed rgba(37,99,235,0.25)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {uploading ? "업로드 중..." : "기획안 업로드"}
            <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg" />
          </label>
        </div>
      )}

      {/* 프리미엄 모달 */}
      {showPremium && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">프리미엄 서비스</h3>
            <p className="text-sm text-gray-500 mb-4">{premiumMsg}</p>
            <p className="text-xs text-gray-400 mb-5">무제한 파일, 용량 업그레이드, 고급 AI 분석</p>
            <button className="btn-jelly drop-btn w-full py-2.5 rounded-xl text-sm mb-2">구독하기 (준비 중)</button>
            <button onClick={() => setShowPremium(false)} className="text-sm text-gray-400 hover:text-gray-600">닫기</button>
          </div>
        </div>
      )}
    </section>
  );
}

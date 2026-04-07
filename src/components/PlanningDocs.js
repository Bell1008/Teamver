"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#2563eb";
const MAX_FREE_PLANNING = 3;
const MAX_SIZE_MB = 5;

function fileIcon(mime) {
  if (!mime) return "📄";
  if (mime.startsWith("image/")) return "🖼";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
  return "📄";
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
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

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

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
      // Supabase Storage 업로드
      const path = `${projectId}/planning/${Date.now()}_${file.name}`;
      const { error: storErr } = await supabase.storage.from("teamver").upload(path, file);
      if (storErr) throw storErr;

      const { data: { publicUrl } } = supabase.storage.from("teamver").getPublicUrl(path);

      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, member_name: memberName, name: file.name, url: publicUrl, size: file.size, mime_type: file.type, category: "planning", description: desc.trim() || null }),
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
      <div className="space-y-2 mb-3">
        {docs.length === 0 && <p className="text-xs text-gray-300 text-center py-3">기획안을 올려주세요.</p>}
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl group" style={{ backgroundColor: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.07)" }}>
            <span className="text-base shrink-0">{fileIcon(doc.mime_type)}</span>
            <div className="flex-1 min-w-0">
              <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-gray-700 hover:text-blue-600 truncate block transition-colors">{doc.name}</a>
              {doc.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.description}</p>}
              <p className="text-xs text-gray-300 mt-0.5">{formatSize(doc.size)} · {doc.member_name}</p>
            </div>
            {canUpload && (
              <button onClick={() => handleDelete(doc.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                </svg>
              </button>
            )}
          </div>
        ))}
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

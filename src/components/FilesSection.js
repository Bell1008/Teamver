"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#2563eb";

function fileIcon(mime) {
  if (!mime) return null;
  if (mime.startsWith("image/")) return "img";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("word") || mime.includes("document")) return "doc";
  if (mime.includes("sheet") || mime.includes("excel")) return "xls";
  return "file";
}

const FILE_COLORS = { img: "#10b981", pdf: "#ef4444", doc: "#3b82f6", xls: "#22c55e", file: "#6b7280" };
const FILE_LABELS = { img: "IMG", pdf: "PDF", doc: "DOC", xls: "XLS", file: "FILE" };

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function FilesSection({ projectId, memberId, memberName }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [premiumMsg, setPremiumMsg] = useState("");

  const fetchFiles = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files?category=file`);
    const data = await res.json();
    if (Array.isArray(data)) setFiles(data);
  }, [projectId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > 20 * 1024 * 1024) { alert("파일 크기는 20MB 이하여야 합니다."); return; }

    setUploading(true);
    try {
      const path = `${projectId}/files/${Date.now()}_${file.name}`;
      const { error: storErr } = await supabase.storage.from("teamver").upload(path, file);
      if (storErr) throw storErr;

      const { data: { publicUrl } } = supabase.storage.from("teamver").getPublicUrl(path);

      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, member_name: memberName, name: file.name, url: publicUrl, size: file.size, mime_type: file.type, category: "file" }),
      });
      const data = await res.json();
      if (res.status === 402) { setPremiumMsg(data.error); setShowPremium(true); return; }
      if (!res.ok) throw new Error(data.error);
      fetchFiles();
    } catch (err) {
      alert("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm("이 파일을 삭제하시겠습니까?")) return;
    await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    fetchFiles();
  };

  return (
    <section className="rounded-2xl p-5"
      style={{ background:"white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 4px 24px rgba(37,99,235,0.08), 0 1px 4px rgba(37,99,235,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${ACCENT}, #1d4ed8)` }}/>
          <div>
            <h2 className="font-semibold text-gray-800">파일 자료실</h2>
            <p className="text-xs text-gray-400 mt-0.5">사진, 문서, 자료 등을 공유하세요</p>
          </div>
        </div>
        <label className={`btn-jelly flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: ACCENT }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {uploading ? "업로드 중..." : "파일 추가"}
          <input type="file" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {files.length === 0 ? (
        <p className="text-xs text-gray-300 text-center py-4">파일이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((f) => {
            const type = fileIcon(f.mime_type);
            const isImage = f.mime_type?.startsWith("image/");

            return (
              <div key={f.id} className="card-drop rounded-xl overflow-hidden group cursor-pointer" style={{ border: "1px solid rgba(37,99,235,0.07)" }}>
                {isImage ? (
                  <a href={f.url} target="_blank" rel="noreferrer">
                    <div className="aspect-video bg-gray-50 overflow-hidden">
                      <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                    </div>
                  </a>
                ) : (
                  <a href={f.url} target="_blank" rel="noreferrer" className="flex items-center justify-center aspect-video"
                    style={{ backgroundColor: `${FILE_COLORS[type] ?? "#6b7280"}12` }}>
                    <span className="text-xs font-bold" style={{ color: FILE_COLORS[type] ?? "#6b7280" }}>{FILE_LABELS[type]}</span>
                  </a>
                )}
                <div className="px-2.5 py-2 flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(f.size)}</p>
                  </div>
                  <button onClick={() => handleDelete(f.id)} className="opacity-0 group-hover:opacity-100 shrink-0 text-gray-300 hover:text-red-400 transition-all mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
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
            <button className="btn-jelly drop-btn w-full py-2.5 rounded-xl text-sm mb-2">구독하기 (준비 중)</button>
            <button onClick={() => setShowPremium(false)} className="text-sm text-gray-400 hover:text-gray-600">닫기</button>
          </div>
        </div>
      )}
    </section>
  );
}

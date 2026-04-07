"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const ACCENT = "#2563eb";

// 확장자 → 타입 정보
const EXT_MAP = {
  pdf:  { label:"PDF",  bg:"#fee2e2", color:"#dc2626" },
  ppt:  { label:"PPT",  bg:"#ffedd5", color:"#ea580c" },
  pptx: { label:"PPT",  bg:"#ffedd5", color:"#ea580c" },
  key:  { label:"KEY",  bg:"#ffedd5", color:"#ea580c" },
  doc:  { label:"DOC",  bg:"#dbeafe", color:"#2563eb" },
  docx: { label:"DOC",  bg:"#dbeafe", color:"#2563eb" },
  hwp:  { label:"HWP",  bg:"#dbeafe", color:"#1d4ed8" },
  xls:  { label:"XLS",  bg:"#dcfce7", color:"#16a34a" },
  xlsx: { label:"XLS",  bg:"#dcfce7", color:"#16a34a" },
  csv:  { label:"CSV",  bg:"#dcfce7", color:"#15803d" },
  md:   { label:"MD",   bg:"#f1f5f9", color:"#475569" },
  txt:  { label:"TXT",  bg:"#f1f5f9", color:"#64748b" },
  json: { label:"JSON", bg:"#fef9c3", color:"#854d0e" },
  zip:  { label:"ZIP",  bg:"#fef9c3", color:"#ca8a04" },
  rar:  { label:"RAR",  bg:"#fef9c3", color:"#a16207" },
  png:  { label:"IMG",  bg:"#d1fae5", color:"#059669" },
  jpg:  { label:"IMG",  bg:"#d1fae5", color:"#059669" },
  jpeg: { label:"IMG",  bg:"#d1fae5", color:"#059669" },
  gif:  { label:"GIF",  bg:"#d1fae5", color:"#10b981" },
  webp: { label:"IMG",  bg:"#d1fae5", color:"#059669" },
  svg:  { label:"SVG",  bg:"#d1fae5", color:"#047857" },
  mp4:  { label:"VID",  bg:"#ede9fe", color:"#7c3aed" },
  mov:  { label:"VID",  bg:"#ede9fe", color:"#7c3aed" },
  mp3:  { label:"AUD",  bg:"#fce7f3", color:"#db2777" },
};

function getFileInfo(name = "", mime = "") {
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  if (EXT_MAP[ext]) return EXT_MAP[ext];
  if (mime.startsWith("image/")) return EXT_MAP["png"];
  if (mime.includes("pdf")) return EXT_MAP["pdf"];
  if (mime.includes("word")) return EXT_MAP["doc"];
  if (mime.includes("sheet") || mime.includes("excel")) return EXT_MAP["xls"];
  if (mime.includes("presentation") || mime.includes("powerpoint")) return EXT_MAP["ppt"];
  return { label: "FILE", bg: "#f1f5f9", color: "#64748b" };
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 14) return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  if (d > 0) return `${d}일 전`;
  if (h > 0) return `${h}시간 전`;
  if (m > 0) return `${m}분 전`;
  return "방금";
}

// UUID 기반 안전한 Storage 경로 생성 (한글/특수문자 방지)
function makeSafePath(projectId, folder, originalName) {
  const ext = originalName.includes(".") ? originalName.split(".").pop().toLowerCase() : "";
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${projectId}/${folder}/${uid}${ext ? "." + ext : ""}`;
}

function FileRow({ file, canDelete, onDelete }) {
  const info = getFileInfo(file.name, file.mime_type ?? "");
  const isImage = file.mime_type?.startsWith("image/");

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 group rounded-xl transition-all"
      style={{ backgroundColor: "rgba(248,250,255,0.8)", border: "1px solid rgba(37,99,235,0.07)" }}
    >
      {/* 타입 뱃지 */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
        style={{ backgroundColor: info.bg, color: info.color }}
      >
        {info.label}
      </div>

      {/* 파일 이름 + 메타 */}
      <div className="flex-1 min-w-0">
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-gray-800 hover:text-blue-600 truncate block transition-colors leading-tight"
        >
          {file.name}
        </a>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {[file.member_name, formatSize(file.size), timeAgo(file.created_at)]
            .filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* 이미지 썸네일 */}
      {isImage && (
        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border" style={{ borderColor: "rgba(37,99,235,0.08)" }}>
          <img src={file.url} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      {/* 다운로드 + 삭제 */}
      <div className="flex items-center gap-1 shrink-0 transition-opacity">
        <a
          href={file.url}
          download={file.name}
          target="_blank"
          rel="noreferrer"
          className="btn-jelly w-7 h-7 flex items-center justify-center rounded-lg transition-all"
          style={{ backgroundColor: "rgba(37,99,235,0.08)", color: ACCENT }}
          title="다운로드"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </a>
        {canDelete && (
          <button
            onClick={() => onDelete(file.id)}
            className="btn-jelly w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 transition-colors"
            title="삭제"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function FilesSection({ projectId, memberId, memberName }) {
  const [files, setFiles]         = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [premiumMsg, setPremiumMsg]   = useState("");

  const fetchFiles = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/files?category=file`);
    const data = await res.json();
    if (Array.isArray(data)) setFiles(data);
  }, [projectId]);

  useEffect(() => {
    fetchFiles();
    const ch = supabase.channel(`files-${projectId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_files", filter: `project_id=eq.${projectId}` }, fetchFiles)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [projectId, fetchFiles]);

  const handleUpload = async (e) => {
    const fileList = Array.from(e.target.files ?? []);
    if (!fileList.length) return;
    e.target.value = "";

    for (const file of fileList) {
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name}: 파일 크기는 20MB 이하여야 합니다.`);
        continue;
      }

      setUploading(true);
      try {
        const storagePath = makeSafePath(projectId, "files", file.name);
        const { error: storErr } = await supabase.storage.from("teamver").upload(storagePath, file);
        if (storErr) throw storErr;

        const { data: { publicUrl } } = supabase.storage.from("teamver").getPublicUrl(storagePath);

        const res = await fetch(`/api/projects/${projectId}/files`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            member_id: memberId ?? null,
            member_name: memberName ?? null,
            name: file.name,
            url: publicUrl,
            storage_path: storagePath,
            size: file.size,
            mime_type: file.type,
            category: "file",
          }),
        });
        const data = await res.json();
        if (res.status === 402) { setPremiumMsg(data.error); setShowPremium(true); break; }
        if (!res.ok) throw new Error(data.error ?? "업로드 실패");
      } catch (err) {
        alert(`${file.name} 업로드 실패: ${err.message}`);
      } finally {
        setUploading(false);
      }
    }
    fetchFiles();
  };

  const handleDelete = async (fileId) => {
    if (!confirm("이 파일을 삭제하시겠습니까?")) return;
    await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    fetchFiles();
  };

  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: "white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 4px 24px rgba(37,99,235,0.08), 0 1px 4px rgba(37,99,235,0.04)" }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${ACCENT}, #1d4ed8)` }} />
          <div>
            <h2 className="font-semibold text-gray-800">파일 자료실</h2>
            <p className="text-xs text-gray-400 mt-0.5">PDF · PPT · 이미지 · 문서 · 메모 등</p>
          </div>
        </div>
        <label
          className={`btn-jelly flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, color: "white", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          </svg>
          {uploading ? "업로드 중..." : "파일 추가"}
          <input
            type="file" multiple className="hidden" onChange={handleUpload}
            accept=".pdf,.ppt,.pptx,.key,.doc,.docx,.hwp,.xls,.xlsx,.csv,.txt,.md,.json,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip,.rar,.mp4,.mov,.mp3"
          />
        </label>
      </div>

      {/* 파일 목록 */}
      {files.length === 0 ? (
        <div className="text-center py-8 rounded-xl" style={{ backgroundColor: "rgba(37,99,235,0.025)", border: "1px dashed rgba(37,99,235,0.15)" }}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.07)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">파일이 없습니다</p>
          <p className="text-xs text-gray-400 mt-1">PDF, PPT, 이미지, 메모 등을 업로드하세요</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {files.map((f) => (
            <FileRow key={f.id} file={f} canDelete onDelete={handleDelete} />
          ))}
        </div>
      )}

      {files.length > 0 && (
        <p className="text-xs text-gray-300 mt-3 text-right">총 {files.length}개 · {formatSize(files.reduce((s, f) => s + (f.size ?? 0), 0))}</p>
      )}

      {/* 프리미엄 모달 */}
      {showPremium && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { useDialog } from "@/components/DialogProvider";

const ACCENT = "#2563eb";

// ── 타입별 아이콘 (SVG) ───────────────────────────────────
const TypeIcons = {
  kickoff: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  aggregate: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  summary: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  ),
  minutes: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  journal: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
};

const TYPE_CONFIG = {
  kickoff:   { label: "킥오프",     color: "#7c3aed", bg: "rgba(124,58,237,0.1)",  border: "rgba(124,58,237,0.25)" },
  aggregate: { label: "집계 리포트", color: "#0891b2", bg: "rgba(8,145,178,0.1)",   border: "rgba(8,145,178,0.25)"  },
  summary:   { label: "AI 요약",    color: ACCENT,    bg: "rgba(37,99,235,0.1)",   border: "rgba(37,99,235,0.25)"  },
  minutes:   { label: "회의록",     color: "#059669", bg: "rgba(5,150,105,0.1)",   border: "rgba(5,150,105,0.25)"  },
  journal:   { label: "팀 일지",    color: "#059669", bg: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.2)"   },
};

const HEALTH_COLOR = { good: "#16a34a", warning: "#b45309", critical: "#dc2626" };
const RISK_COLOR   = { high: "#dc2626", medium: "#b45309", low: "#16a34a" };

function KickoffContent({ content }) {
  return (
    <div className="space-y-4">
      {content.role_assignments?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">역할 배정</p>
          <div className="space-y-2">
            {content.role_assignments.map((ra, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.1)" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                  {ra.member_name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{ra.member_name} <span className="font-normal text-gray-500">— {ra.role}</span></p>
                  {ra.responsibilities?.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {ra.responsibilities.map((r, j) => (
                        <li key={j} className="text-xs text-gray-500 flex items-start gap-1">
                          <span className="text-purple-400 mt-0.5 shrink-0">·</span>{r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.milestones?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">마일스톤</p>
          <div className="space-y-2">
            {content.milestones.map((ms, i) => (
              <div key={i} className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.08)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-purple-600">{ms.week}주차</span>
                  <span className="text-xs font-semibold text-gray-700">{ms.title}</span>
                </div>
                {ms.tasks?.map((t, j) => (
                  <p key={j} className="text-xs text-gray-500 flex items-start gap-1">
                    <span className="text-purple-300 shrink-0">·</span>{t}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AggregateContent({ content }) {
  const health = content.overall_health ?? "warning";
  return (
    <div className="space-y-4">
      {/* 요약 */}
      {content.summary && (
        <div className="px-3 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.1)" }}>
          <p className="text-xs text-gray-600 leading-relaxed">{content.summary}</p>
        </div>
      )}
      {/* 멤버별 점수 */}
      {content.member_analysis?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">기여도</p>
          <div className="space-y-2">
            {[...content.member_analysis].sort((a, b) => (b.contribution_score ?? 0) - (a.contribution_score ?? 0)).map((m, i) => {
              const s = m.contribution_score ?? 0;
              const c = s >= 80 ? "#16a34a" : s >= 50 ? ACCENT : s >= 30 ? "#b45309" : "#dc2626";
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <p className="text-xs font-semibold text-gray-700 w-16 truncate shrink-0">{m.name}</p>
                  <div className="flex-1 rounded-full h-2" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${s}%`, background: `linear-gradient(90deg, ${c}, ${c}cc)` }} />
                  </div>
                  <span className="text-xs font-black tabular-nums w-7 text-right shrink-0" style={{ color: c }}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* 리스크 */}
      {content.risks?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">리스크</p>
          <div className="space-y-1.5">
            {content.risks.map((r, i) => {
              const rc = RISK_COLOR[r.level] ?? RISK_COLOR.medium;
              return (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600 px-2.5 py-2 rounded-lg" style={{ backgroundColor: `${rc}10`, border: `1px solid ${rc}30` }}>
                  <span className="font-bold shrink-0" style={{ color: rc }}>{r.level === "high" ? "높음" : r.level === "medium" ? "보통" : "낮음"}</span>
                  <span>{r.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* 우선순위 */}
      {content.priorities?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">우선순위</p>
          {content.priorities.map((p, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-600 py-1.5">
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}>{p.rank ?? i + 1}</span>
              <span className="pt-0.5">{p.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextContent({ content }) {
  return (
    <div className="px-3 py-3 rounded-xl whitespace-pre-wrap text-sm text-gray-700 leading-relaxed"
      style={{ backgroundColor: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.08)" }}>
      {content.text ?? ""}
      {content.source_message_count != null && (
        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">채팅 {content.source_message_count}개 기반</p>
      )}
    </div>
  );
}

/* ── 인라인 마크다운 렌더러 (**bold**, 나머지 텍스트) ── */
function renderInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return part || null;
  });
}

/* ── 마크다운 전체 렌더러 (모달 전용) ── */
function MarkdownContent({ content }) {
  const text = content.text ?? "";
  const count = content.source_message_count;

  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // h1
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3 first:mt-0">
          {renderInline(line.slice(2))}
        </h1>
      );
      i++; continue;
    }
    // h2
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-sm font-bold mt-5 mb-2 pb-1.5 border-b"
          style={{ color: ACCENT, borderColor: "rgba(37,99,235,0.15)" }}>
          {renderInline(line.slice(3))}
        </h2>
      );
      i++; continue;
    }
    // h3
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
      i++; continue;
    }
    // 구분선
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-4 border-gray-100" />);
      i++; continue;
    }
    // 불릿 리스트
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(
          <li key={i} className="text-sm text-gray-700 leading-relaxed">
            {renderInline(lines[i].slice(2))}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-outside pl-5 space-y-1 my-2">
          {items}
        </ul>
      );
      continue;
    }
    // 테이블
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // 구분선 행 제거 (| --- | 형태)
      const dataRows = tableLines.filter((r) => !/^\|[-:\s|]+\|$/.test(r.trim()));
      elements.push(
        <div key={`tbl-${i}`} className="overflow-x-auto my-3 rounded-xl border" style={{ borderColor: "rgba(37,99,235,0.12)" }}>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {dataRows.map((row, ri) => {
                const cells = row.split("|").slice(1, -1); // 앞뒤 빈 항목 제거
                return (
                  <tr key={ri} style={{ backgroundColor: ri === 0 ? "rgba(37,99,235,0.06)" : ri % 2 === 1 ? "rgba(37,99,235,0.02)" : "transparent" }}>
                    {cells.map((cell, ci) =>
                      ri === 0 ? (
                        <th key={ci} className="px-3 py-2 text-left font-semibold text-gray-700 border-b"
                          style={{ borderColor: "rgba(37,99,235,0.12)" }}>
                          {cell.trim()}
                        </th>
                      ) : (
                        <td key={ci} className="px-3 py-2 text-gray-600 border-b"
                          style={{ borderColor: "rgba(37,99,235,0.06)" }}>
                          {renderInline(cell.trim())}
                        </td>
                      )
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    // 빈 줄
    if (line.trim() === "") { i++; continue; }
    // 일반 문단
    elements.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed my-1.5">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return (
    <div>
      {elements}
      {count != null && (
        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
          채팅 {count}개 기반
        </p>
      )}
    </div>
  );
}

/* ── 상세 팝업 모달 ───────────────────────────────────────── */
function DetailModal({ artifact, onClose, onDelete, canManage }) {
  const tc = TYPE_CONFIG[artifact.type] ?? TYPE_CONFIG.summary;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[94vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{ background: "white", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="shrink-0 px-5 pt-5 pb-4 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${tc.color}e8, ${tc.color})` }}>
          {/* 배경 물방울 데코 */}
          <div className="absolute top-[-20px] right-[60px] w-24 h-28 rounded-full pointer-events-none"
            style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}>
                {TypeIcons[artifact.type]?.("white")}
              </div>
              <div className="min-w-0">
                <p className="text-white/70 text-xs font-semibold">{tc.label}</p>
                <p className="text-white font-bold text-base leading-tight mt-0.5 break-words">{artifact.title}</p>
                <p className="text-white/55 text-xs mt-1">{formatDate(artifact.created_at)}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white transition-colors shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 본문 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {artifact.type === "kickoff"   && <KickoffContent   content={artifact.content} />}
          {artifact.type === "aggregate" && <AggregateContent content={artifact.content} />}
          {(artifact.type === "summary" || artifact.type === "minutes" || artifact.type === "journal") && (
            <MarkdownContent content={artifact.content} />
          )}
        </div>

        {/* 하단 버튼 — 관리자/방장만 삭제 가능 */}
        {canManage && (
          <div className="shrink-0 px-5 py-4 flex justify-end border-t"
            style={{ borderColor: "rgba(37,99,235,0.08)" }}>
            <button
              onClick={() => { onDelete(artifact.id); onClose(); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 목록 카드 (클릭 → 상세 팝업) ──────────────────────────── */
function ArtifactCard({ artifact, onDelete, onOpen }) {
  const tc = TYPE_CONFIG[artifact.type] ?? TYPE_CONFIG.summary;

  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-2xl transition-all group"
      style={{ background: "white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 12px rgba(37,99,235,0.06)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.13)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(37,99,235,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
      onClick={() => onOpen(artifact)}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: tc.bg, border: `1px solid ${tc.border}` }}>
        {TypeIcons[artifact.type]?.(tc.color)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{artifact.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-semibold" style={{ color: tc.color }}>{tc.label}</span>
          <span className="text-xs text-gray-400">{formatDate(artifact.created_at)}</span>
        </div>
      </div>
      {/* 열기 화살표 */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round"
        className="shrink-0 group-hover:stroke-blue-400 transition-colors">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  );
}

const FILTER_OPTIONS = [
  { key: "all",       label: "전체" },
  { key: "kickoff",   label: "킥오프" },
  { key: "aggregate", label: "집계" },
  { key: "minutes",   label: "회의록" },
  { key: "journal",   label: "팀 일지" },
];

export default function AIArchive({ projectId, isOpen, onClose, refreshKey, canManage = false }) {
  const dialog = useDialog();
  const [artifacts, setArtifacts]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [filter, setFilter]               = useState("all");
  const [selectedArtifact, setSelected]   = useState(null);

  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/artifacts`);
      const data = await res.json();
      if (Array.isArray(data)) setArtifacts(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) fetchArtifacts();
  }, [isOpen, fetchArtifacts, refreshKey]);

  const handleDelete = async (artifactId) => {
    if (!await dialog.confirm("이 항목을 삭제하시겠습니까?", { title: "항목 삭제", confirmText: "삭제", danger: true })) return;
    await fetch(`/api/projects/${projectId}/artifacts?artifactId=${artifactId}`, { method: "DELETE" });
    setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
    if (selectedArtifact?.id === artifactId) setSelected(null);
  };

  if (!isOpen) return null;

  // journal_draft는 보관함에서 제외 (JournalPanel 전용)
  const visible = artifacts.filter((a) => a.type !== "journal_draft");
  const filtered = filter === "all" ? visible : visible.filter((a) => a.type === filter);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="w-full sm:max-w-xl max-h-[92vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl"
        style={{ background: "#f4f8ff", boxShadow: "0 -8px 40px rgba(37,99,235,0.18), 0 24px 60px rgba(0,0,0,0.25)" }}
      >
        {/* 헤더 */}
        <div className="shrink-0 px-5 pt-5 pb-4 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a8a 100%)` }}>
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div style={{ position:"absolute",top:"-20px",right:"50px",width:90,height:100,borderRadius:"50% 50% 50% 50%/60% 60% 40% 40%",background:"rgba(255,255,255,0.05)"}}/>
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-sm">AI 작업물 보관함</h2>
                <p className="text-white/50 text-xs mt-0.5">킥오프 · 집계 · 요약 · 회의록</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="shrink-0 px-4 py-3 flex gap-1.5 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(37,99,235,0.08)", background: "white" }}>
          {FILTER_OPTIONS.map(({ key, label }) => {
            const count = key === "all" ? visible.length : visible.filter((a) => a.type === key).length;
            return (
              <button key={key} onClick={() => setFilter(key)}
                className="btn-jelly shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={filter === key
                  ? { background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, color: "white", boxShadow: `0 2px 8px rgba(37,99,235,0.3)` }
                  : { backgroundColor: "rgba(37,99,235,0.06)", color: "#64748b" }}>
                {label} {count > 0 && <span className="ml-0.5 opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-500 animate-spin" />
              <p className="text-sm text-gray-400">불러오는 중...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(37,99,235,0.07)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-500">저장된 AI 작업물이 없습니다</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                킥오프, 집계 에이전트, AI 요약/회의록을<br />실행하면 자동으로 여기 저장됩니다.
              </p>
            </div>
          ) : (
            filtered.map((a) => <ArtifactCard key={a.id} artifact={a} onDelete={handleDelete} onOpen={setSelected} />)
          )}
          <div className="h-2" />
        </div>
      </div>
      {selectedArtifact && (
        <DetailModal
          artifact={selectedArtifact}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
          canManage={canManage}
        />
      )}
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

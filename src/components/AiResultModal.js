"use client";

const ACCENT = "#2563eb";

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function renderInline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    return part;
  });
}

function MarkdownContent({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-3 first:mt-0">
          {renderInline(line.slice(2))}
        </h1>
      );
      i++; continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-sm font-bold mt-5 mb-2 pb-1.5 border-b"
          style={{ color: ACCENT, borderColor: "rgba(37,99,235,0.15)" }}>
          {renderInline(line.slice(3))}
        </h2>
      );
      i++; continue;
    }

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
      i++; continue;
    }

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
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2 pl-1">{items}</ul>
      );
      continue;
    }

    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const [headerRow, , ...dataRows] = tableLines;
      const headers = headerRow.split("|").filter((c) => c.trim());
      elements.push(
        <div key={`tbl-${i}`} className="overflow-x-auto my-3 rounded-xl border" style={{ borderColor: "rgba(37,99,235,0.12)" }}>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ backgroundColor: "rgba(37,99,235,0.06)" }}>
                {headers.map((h, hi) => (
                  <th key={hi} className="px-3 py-2 text-left font-semibold" style={{ color: ACCENT }}>{h.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "" : "bg-gray-50/60"}>
                  {row.split("|").filter((c) => c.trim()).map((cell, ci) => (
                    ci === 0 ? (
                      <td key={ci} className="px-3 py-2 font-medium text-gray-800 border-b" style={{ borderColor: "rgba(37,99,235,0.06)" }}>
                        {renderInline(cell.trim())}
                      </td>
                    ) : (
                      <td key={ci} className="px-3 py-2 text-gray-600 border-b" style={{ borderColor: "rgba(37,99,235,0.06)" }}>
                        {renderInline(cell.trim())}
                      </td>
                    )
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.trim() === "---" || line.trim() === "────────") {
      elements.push(<hr key={i} className="my-4" style={{ borderColor: "rgba(37,99,235,0.1)" }} />);
      i++; continue;
    }

    if (line.trim() === "") {
      i++; continue;
    }

    elements.push(
      <p key={i} className="text-sm text-gray-700 leading-relaxed my-1.5">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

/**
 * AI 결과를 팝업 형식으로 표시하는 모달
 * @param {string} title - 팝업 제목
 * @param {string} text - 마크다운 텍스트 내용
 * @param {string} [badge] - 상단 뱃지 레이블 (선택)
 * @param {Function} onClose - 닫기 핸들러
 */
export default function AiResultModal({ title, text, badge, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl mb-12"
        style={{ backgroundColor: "#fff", border: "1px solid rgba(37,99,235,0.12)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)`, boxShadow: `0 2px 16px rgba(37,99,235,0.35)` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{title}</p>
              {badge && <p className="text-white/55 text-xs mt-0.5">{badge}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-jelly w-8 h-8 flex items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: "72vh" }}>
          <MarkdownContent text={text} />
        </div>
      </div>
    </div>
  );
}

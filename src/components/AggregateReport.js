"use client";

const ACCENT = "#2563eb";

const HEALTH_CONFIG = {
  good:     { label: "양호",     bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.3)",   color: "#16a34a",  dot: "#22c55e" },
  warning:  { label: "주의",     bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",   color: "#b45309",  dot: "#f59e0b" },
  critical: { label: "위험",     bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)",  color: "#dc2626",  dot: "#ef4444" },
};

const RISK_CONFIG = {
  high:   { label: "높음", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)", color: "#dc2626" },
  medium: { label: "보통", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.25)",  color: "#b45309" },
  low:    { label: "낮음", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.25)",  color: "#16a34a" },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#2563eb,#1d4ed8)",
  "linear-gradient(135deg,#7c3aed,#6d28d9)",
  "linear-gradient(135deg,#0891b2,#0e7490)",
  "linear-gradient(135deg,#059669,#047857)",
  "linear-gradient(135deg,#d97706,#b45309)",
  "linear-gradient(135deg,#db2777,#be185d)",
];

function ScoreBar({ value = 0, color = ACCENT, height = 8 }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, backgroundColor: "rgba(37,99,235,0.07)" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 6px ${color}50`,
        }}
      />
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="flex flex-col items-center px-2.5 py-2 rounded-xl" style={{ backgroundColor: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.08)" }}>
      <p className="text-sm font-black tabular-nums" style={{ color: ACCENT }}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">{label}</p>
    </div>
  );
}

function MemberCard({ member, idx }) {
  const score = member.contribution_score ?? 0;
  const grad  = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];

  const scoreColor =
    score >= 80 ? "#16a34a" :
    score >= 50 ? ACCENT    :
    score >= 30 ? "#b45309" : "#dc2626";

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 12px rgba(37,99,235,0.06)" }}
    >
      {/* 멤버 헤더 */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
          style={{ background: grad, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
        >
          {member.name?.[0] ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm leading-tight truncate">{member.name}</p>
          {member.role && <p className="text-xs text-gray-400 mt-0.5 truncate">{member.role}</p>}
        </div>
        {/* 기여도 점수 원형 배지 */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0"
          style={{ background: `radial-gradient(circle, ${scoreColor}18 0%, ${scoreColor}08 100%)`, border: `2px solid ${scoreColor}40`, color: scoreColor }}
        >
          {score}
        </div>
      </div>

      {/* 기여도 바 */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-gray-500">기여도 점수</span>
          <span className="text-xs font-black tabular-nums" style={{ color: scoreColor }}>{score}점</span>
        </div>
        <ScoreBar value={score} color={scoreColor} height={9} />
      </div>

      {/* 미니 통계 4칸 */}
      <div className="grid grid-cols-4 gap-1.5">
        <MiniStat label="완료율" value={`${member.task_completion_rate ?? 0}%`} />
        <MiniStat label="진행도" value={`${member.avg_progress ?? 0}%`} />
        <MiniStat label="파일"   value={member.files_count ?? 0} />
        <MiniStat label="채팅"   value={member.messages_count ?? 0} />
      </div>

      {/* 할일 현황 */}
      {(member.task_total ?? 0) > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <span>할 일 {member.task_done ?? 0}/{member.task_total ?? 0} 완료</span>
          <div className="flex-1 ml-1">
            <ScoreBar value={(member.task_done ?? 0) / (member.task_total ?? 1) * 100} color={ACCENT} height={4} />
          </div>
        </div>
      )}

      {/* 하이라이트 */}
      {member.highlights?.length > 0 && (
        <div className="space-y-1">
          {member.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
              <span className="text-green-500 mt-0.5 shrink-0">✓</span>
              <span>{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* 개선점 */}
      {member.concerns?.length > 0 && (
        <div className="space-y-1">
          {member.concerns.map((c, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
              <span className="text-amber-400 mt-0.5 shrink-0">△</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AggregateReport({ report, onClose }) {
  if (!report) return null;

  const health = HEALTH_CONFIG[report.overall_health] ?? HEALTH_CONFIG.warning;
  const sortedMembers = [...(report.member_analysis ?? [])].sort(
    (a, b) => (b.contribution_score ?? 0) - (a.contribution_score ?? 0)
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl"
        style={{ background: "#f4f8ff", boxShadow: "0 -8px 40px rgba(37,99,235,0.18), 0 24px 60px rgba(0,0,0,0.25)" }}
      >
        {/* 모달 헤더 */}
        <div
          className="shrink-0 px-6 pt-5 pb-4 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #1d4ed8 60%, #312e81 100%)` }}
        >
          {/* 배너 물방울 deco */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div style={{ position:"absolute",top:"-20px",right:"40px",width:90,height:110,borderRadius:"50% 50% 50% 50%/60% 60% 40% 40%",background:"rgba(255,255,255,0.06)" }}/>
            <div style={{ position:"absolute",bottom:"-15px",right:"5px",width:60,height:70,borderRadius:"50% 50% 50% 50%/60% 60% 40% 40%",background:"rgba(255,255,255,0.04)" }}/>
          </div>

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                </svg>
                <h2 className="text-white font-bold text-base">집계 에이전트 리포트</h2>
              </div>
              <p className="text-white/55 text-xs">
                {report.generated_at ? new Date(report.generated_at).toLocaleString("ko-KR", { month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit" }) : ""}
              </p>
            </div>

            {/* 전체 건강도 배지 */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: health.bg, border: `1px solid ${health.border}`, color: health.color }}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: health.dot }} />
                {health.label}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white/70 hover:text-white transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 요약 */}
          {report.summary && (
            <p className="relative mt-3 text-xs text-white/75 leading-relaxed">{report.summary}</p>
          )}
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* 팀 분위기 */}
          {report.team_dynamic && (
            <div
              className="px-4 py-3 rounded-2xl flex items-start gap-2.5"
              style={{ background: "white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 12px rgba(37,99,235,0.06)" }}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `linear-gradient(135deg, ${ACCENT}18, ${ACCENT}08)` }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-0.5">팀 협업 평가</p>
                <p className="text-sm text-gray-700 leading-relaxed">{report.team_dynamic}</p>
              </div>
            </div>
          )}

          {/* 기여도 순위 헤더 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${ACCENT}, #1d4ed8)` }} />
              <h3 className="font-semibold text-gray-800 text-sm">멤버별 기여도 분석</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(37,99,235,0.08)", color: ACCENT }}
              >
                {sortedMembers.length}명
              </span>
            </div>

            {/* 기여도 순위 바 차트 (요약) */}
            <div
              className="rounded-2xl p-4 mb-3 space-y-2.5"
              style={{ background: "white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 12px rgba(37,99,235,0.06)" }}
            >
              {sortedMembers.map((m, idx) => {
                const score = m.contribution_score ?? 0;
                const scoreColor =
                  score >= 80 ? "#16a34a" :
                  score >= 50 ? ACCENT    :
                  score >= 30 ? "#b45309" : "#dc2626";
                const grad = AVATAR_GRADIENTS[
                  (report.member_analysis ?? []).findIndex((x) => x.member_id === m.member_id || x.name === m.name) % AVATAR_GRADIENTS.length
                ];
                return (
                  <div key={m.member_id ?? m.name} className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-400 w-4 text-center font-bold tabular-nums">{idx + 1}</span>
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                      style={{ background: grad }}
                    >
                      {m.name?.[0] ?? "?"}
                    </div>
                    <p className="text-xs font-semibold text-gray-700 w-16 truncate shrink-0">{m.name}</p>
                    <div className="flex-1">
                      <ScoreBar value={score} color={scoreColor} height={7} />
                    </div>
                    <span className="text-xs font-black tabular-nums w-8 text-right shrink-0" style={{ color: scoreColor }}>{score}</span>
                  </div>
                );
              })}
            </div>

            {/* 멤버 카드 목록 */}
            <div className="space-y-3">
              {sortedMembers.map((m, idx) => (
                <MemberCard
                  key={m.member_id ?? m.name}
                  member={m}
                  idx={(report.member_analysis ?? []).findIndex((x) => x.member_id === m.member_id || x.name === m.name)}
                />
              ))}
            </div>
          </div>

          {/* 리스크 */}
          {report.risks?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #ef4444, #dc2626)" }} />
                <h3 className="font-semibold text-gray-800 text-sm">리스크</h3>
              </div>
              <div className="space-y-2">
                {report.risks.map((r, i) => {
                  const rc = RISK_CONFIG[r.level] ?? RISK_CONFIG.medium;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: rc.bg, border: `1px solid ${rc.border}` }}
                    >
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 mt-0.5"
                        style={{ backgroundColor: rc.border, color: rc.color }}
                      >
                        {rc.label}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{r.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 우선순위 */}
          {report.priorities?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full" style={{ background: `linear-gradient(180deg, ${ACCENT}, #1d4ed8)` }} />
                <h3 className="font-semibold text-gray-800 text-sm">우선순위 권고</h3>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "white", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 12px rgba(37,99,235,0.06)" }}
              >
                {report.priorities.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3"
                    style={{ borderBottom: i < report.priorities.length - 1 ? "1px solid rgba(37,99,235,0.07)" : "none" }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5"
                      style={{ background: `linear-gradient(135deg, ${ACCENT}, #1d4ed8)` }}
                    >
                      {p.rank ?? i + 1}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}

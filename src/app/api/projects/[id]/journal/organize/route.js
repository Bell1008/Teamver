import { supabase } from "@/lib/supabase";
import { getProjectPersona } from "@/lib/projectPersona";

const GEMINI_MODELS = [
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
];

async function callGemini(systemPrompt, userText) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 환경변수가 없습니다.");
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.2 },
  });
  for (const url of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${url}?key=${key}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
      });
      if (res.ok) return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (res.status === 429 || res.status === 503) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1500));
        continue;
      }
      break;
    }
  }
  throw new Error("AI 서비스가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.");
}

// POST /api/projects/[id]/journal/organize — 최근 7일 기여 내용 AI 정리 → journal_draft 저장
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekCutoff = weekAgo.toISOString().split("T")[0];

    const [
      { data: project },
      { data: logs, error },
      { data: kickoffArtifacts },
      { data: milestones },
    ] = await Promise.all([
      supabase.from("projects").select("title, subject, goal").eq("id", id).single(),
      supabase
        .from("contribution_logs")
        .select("completed_tasks, memo, achievement_rate, date, members(name)")
        .eq("project_id", id)
        .gte("date", weekCutoff)
        .order("date", { ascending: false }),
      supabase
        .from("ai_artifacts")
        .select("content")
        .eq("project_id", id)
        .eq("type", "kickoff")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("milestones")
        .select("week, title, tasks")
        .eq("project_id", id)
        .order("week", { ascending: true }),
    ]);

    if (error) throw error;
    if (!logs?.length)
      return Response.json({ error: "최근 7일 내 입력된 기여 내용이 없어요. 팀원들이 먼저 기여를 기록해야 합니다." }, { status: 400 });

    const persona = getProjectPersona(project);

    // 날짜별로 그룹핑
    const byDate = {};
    for (const l of logs) {
      const d = l.date ?? today;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(l);
    }

    const logText = Object.entries(byDate)
      .map(([date, entries]) => {
        const dateLabel = date === today ? `오늘 (${date})` : date;
        return `[${dateLabel}]\n` + entries.map((l) =>
          `  ${l.members?.name ?? "?"} — 달성률 ${Math.round((l.achievement_rate ?? 0) * 100)}%\n` +
          (l.completed_tasks?.map((t) => `    • ${t}`).join("\n") ?? "") +
          (l.memo ? `\n    메모: ${l.memo}` : "")
        ).join("\n\n");
      })
      .join("\n\n─────\n\n");

    // 킥오프 역할 컨텍스트
    const kickoff = kickoffArtifacts?.[0]?.content;
    const roleCtx = kickoff?.role_assignments?.length
      ? "\n\n[킥오프 역할 배정]\n" + kickoff.role_assignments.map((r) =>
          `${r.name}: ${r.role ?? r.responsibilities ?? ""}`
        ).join("\n")
      : "";

    // 현재 마일스톤 컨텍스트
    const msCtx = milestones?.length
      ? "\n\n[마일스톤]\n" + milestones.map((m) => `Week ${m.week}: ${m.title}`).join("\n")
      : "";

    const systemPrompt = `${persona}

⚠️ 기록에 없는 내용은 절대 추론하거나 채우지 마세요. 실제로 기록된 사항만 작성하고, 부족한 항목은 "기록 없음"으로 표기하세요.

팀원들의 최근 기여 내용을 아래 형식으로 체계적으로 정리하세요.
날짜별 변화 흐름도 함께 언급하세요.

## 기간 요약 (${weekCutoff} ~ ${today})
(팀원 달성률 평균, 전반적 진행 상태 — 기록에 근거해서만)

## 팀원별 기여 요약
(이름 | 완료 작업 | 달성률 | 메모 — 실제 기록만)

## 주요 성과
(기록에서 확인된 핵심 성과 2-4개)

## 이슈 / 다음 할 일
(기록에 언급된 것만)

한국어로 작성하세요.`;

    const userInput = `프로젝트: ${project?.title}${roleCtx}${msCtx}\n\n기여 기록 (최근 7일):\n\n${logText}`;
    const aiText = await callGemini(systemPrompt, userInput);

    const now = new Date();
    const title = `내용 정리 — ${now.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} ${now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;

    const { data: artifact, error: saveErr } = await supabase
      .from("ai_artifacts")
      .insert({
        project_id: id,
        type: "journal_draft",
        title,
        content: { text: aiText, log_count: logs.length, date_range: `${weekCutoff}~${today}` },
      })
      .select().single();
    if (saveErr) throw saveErr;

    return Response.json(artifact, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import { supabase } from "@/lib/supabase";
import { getProjectPersona } from "@/lib/projectPersona";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function callGemini(systemPrompt, userText) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 환경변수가 없습니다.");
  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini 오류 (${res.status})`);
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// POST /api/projects/[id]/journal/organize — 오늘 기여 내용 AI 정리 → journal_draft 저장
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const today = new Date().toISOString().split("T")[0];

    const [{ data: project }, { data: logs, error }] = await Promise.all([
      supabase.from("projects").select("title, subject, goal").eq("id", id).single(),
      supabase
        .from("contribution_logs")
        .select("completed_tasks, memo, achievement_rate, members(name)")
        .eq("project_id", id)
        .eq("date", today),
    ]);
    if (error) throw error;
    if (!logs?.length) return Response.json({ error: "오늘 입력된 기여 내용이 없어요. 먼저 팀원들이 기여를 기록해야 합니다." }, { status: 400 });

    const persona = getProjectPersona(project);
    const logText = logs
      .map((l) =>
        `[${l.members?.name ?? "?"}] 달성률 ${Math.round((l.achievement_rate ?? 0) * 100)}%\n` +
        (l.completed_tasks?.map((t) => `  - ${t}`).join("\n") ?? "") +
        (l.memo ? `\n  메모: ${l.memo}` : "")
      )
      .join("\n\n");

    const systemPrompt = `${persona}

팀원들의 오늘 기여 내용을 아래 형식으로 체계적으로 정리하세요.
간결하고 명확하게, 도메인 특성이 반영된 언어로 작성하세요.

## 오늘의 팀 진행 현황
(팀원 달성률 평균, 전반적 진행 상태)

## 팀원별 기여 요약
(각 팀원의 이름, 완료 작업, 달성률, 메모)

## 주요 성과
(오늘 팀이 이룬 핵심 사항 2-4개)

## 이슈 / 다음 할 일
(리스크나 내일 우선순위)

한국어로 작성하세요.`;

    const aiText = await callGemini(systemPrompt, `프로젝트: ${project?.title}\n날짜: ${today}\n\n기여 내용:\n\n${logText}`);

    const now = new Date();
    const title = `내용 정리 — ${now.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} ${now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;

    const { data: artifact, error: saveErr } = await supabase
      .from("ai_artifacts")
      .insert({ project_id: id, type: "journal_draft", title, content: { text: aiText, log_count: logs.length, date: today } })
      .select().single();
    if (saveErr) throw saveErr;

    return Response.json(artifact, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

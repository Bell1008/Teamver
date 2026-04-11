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

// POST /api/projects/[id]/journal/create — journal_draft들 → 최종 팀 일지 생성 → "journal" artifact 저장
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const today = new Date().toISOString().split("T")[0];

    const [
      { data: project },
      { data: drafts, error: draftErr },
      { data: kickoffArtifacts },
      { data: aggregateArtifacts },
      { data: milestones },
    ] = await Promise.all([
      supabase.from("projects").select("title, subject, goal").eq("id", id).single(),
      supabase
        .from("ai_artifacts")
        .select("title, content, created_at")
        .eq("project_id", id)
        .eq("type", "journal_draft")
        .order("created_at", { ascending: true }),
      supabase
        .from("ai_artifacts")
        .select("content")
        .eq("project_id", id)
        .eq("type", "kickoff")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("ai_artifacts")
        .select("content, created_at")
        .eq("project_id", id)
        .eq("type", "aggregate")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("milestones")
        .select("week, title, tasks")
        .eq("project_id", id)
        .order("week", { ascending: true }),
    ]);

    if (draftErr) throw draftErr;
    if (!drafts?.length) return Response.json({ error: "먼저 '내용 정리'를 실행해주세요." }, { status: 400 });

    const persona = getProjectPersona(project);
    const dateLabel = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

    const draftsText = drafts
      .map((d, i) => `[정리 ${i + 1}: ${d.title}]\n${d.content?.text ?? ""}`)
      .join("\n\n────────\n\n");

    // 킥오프 컨텍스트
    const kickoff = kickoffArtifacts?.[0]?.content;
    const roleCtx = kickoff?.role_assignments?.length
      ? "\n[킥오프 역할] " + kickoff.role_assignments.map((r) => `${r.name}: ${r.role ?? ""}`).join(", ")
      : "";

    // 마일스톤 컨텍스트
    const msCtx = milestones?.length
      ? "\n[마일스톤] " + milestones.map((m) => `Week ${m.week}: ${m.title}`).join(" / ")
      : "";

    // 최근 집계 리포트 컨텍스트
    const aggContent = aggregateArtifacts?.[0]?.content;
    const healthCtx = aggContent?.overall_health
      ? `\n[최근 팀 분석] 건강도: ${aggContent.overall_health}${aggContent.summary ? " — " + aggContent.summary.slice(0, 100) : ""}`
      : "";

    const systemPrompt = `${persona}

⚠️ 정리 내용과 기록에 없는 사항은 절대 추론하거나 채우지 마세요. 실제 기록에 없는 항목은 "해당 없음" 또는 생략하세요.

여러 번의 정리 내용을 바탕으로 오늘의 공식 팀 일지를 작성하세요.
문체는 공식 문서 스타일로, 도메인 특성이 반영된 전문적인 언어를 사용하세요.

형식:
# 팀 일지 — ${dateLabel}

## 오늘의 달성 요약
(핵심 성과를 2-3문장으로 — 기록 기반)

## 팀원 기여 현황
(이름 | 주요 기여 | 달성률 — 표 형식, 실제 기록만)

## 완료된 주요 작업
(기록에서 확인된 것만)

## 이슈 및 리스크
(기록에서 언급된 것만, 없으면 "없음")

## 다음 단계 제안
(마일스톤과 기록 기반으로 — 추론 최소화)

한국어로 작성하세요.`;

    const aiText = await callGemini(
      systemPrompt,
      `프로젝트: ${project?.title}${roleCtx}${msCtx}${healthCtx}\n날짜: ${today}\n\n정리 내용:\n\n${draftsText}`
    );

    const { data: journal, error: saveErr } = await supabase
      .from("ai_artifacts")
      .insert({
        project_id: id,
        type: "journal",
        title: `팀 일지 — ${dateLabel}`,
        content: { text: aiText, draft_count: drafts.length, date: today },
      })
      .select().single();
    if (saveErr) throw saveErr;

    return Response.json(journal, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

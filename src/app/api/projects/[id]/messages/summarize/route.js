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

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { mode = "summary" } = await request.json();

    const [
      { data: project },
      { data: messages, error },
      { data: kickoffArtifacts },
      { data: milestones },
    ] = await Promise.all([
      supabase.from("projects").select("title, subject, goal").eq("id", id).single(),
      supabase.from("messages").select("member_name, content, created_at")
        .eq("project_id", id).eq("is_ai", false)
        .order("created_at", { ascending: true }).limit(200),
      supabase
        .from("ai_artifacts")
        .select("content")
        .eq("project_id", id)
        .eq("type", "kickoff")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("milestones")
        .select("week, title")
        .eq("project_id", id)
        .order("week", { ascending: true }),
    ]);

    if (error) throw error;
    if (!messages?.length) return Response.json({ error: "분석할 대화가 없습니다." }, { status: 400 });

    const persona = getProjectPersona(project);
    const projectCtx = `프로젝트: "${project?.title}" / 과목·도메인: ${project?.subject ?? "미정"} / 목표: ${project?.goal ?? "미정"}`;

    // 킥오프 역할 컨텍스트
    const kickoff = kickoffArtifacts?.[0]?.content;
    const roleCtx = kickoff?.role_assignments?.length
      ? "\n팀원 역할: " + kickoff.role_assignments.map((r) => `${r.name}(${r.role ?? ""})`).join(", ")
      : "";

    // 마일스톤 컨텍스트
    const msCtx = milestones?.length
      ? "\n마일스톤: " + milestones.map((m) => `Week ${m.week} ${m.title}`).join(" / ")
      : "";

    const chatText = messages
      .map((m) => `[${new Date(m.created_at).toLocaleString("ko-KR")}] ${m.member_name}: ${m.content}`)
      .join("\n");

    const STRICT_NOTE = `
⚠️ 중요: 채팅에 명확히 언급된 내용만 작성하세요. 대화에 없는 내용을 추론·가정·임의로 채우지 마세요. 정보가 부족한 항목은 "언급 없음"으로 표기하거나 생략하세요.`;

    const systemPrompt = mode === "minutes"
      ? `${persona}
${projectCtx}${roleCtx}${msCtx}
${STRICT_NOTE}

위 팀플 프로젝트의 채팅 내용을 바탕으로 공식 회의록을 작성하세요.
도메인 특성을 반영한 전문 용어를 사용하고, 대화에서 직접 확인된 내용만 포함하세요.

형식:
## 회의 일시
## 참석자
## 논의 내용
  - 주요 안건별 정리 (도메인 관련 기술·용어 명확히)
## 결정 사항
## 다음 할 일 (Action Items)
  - 담당자와 기한 (대화에서 언급된 경우에만)

한국어로 작성하세요.`
      : `${persona}
${projectCtx}${roleCtx}${msCtx}
${STRICT_NOTE}

위 팀플 프로젝트의 채팅 내용을 읽고 핵심을 4~6문장으로 간결하게 요약하세요.

포함 항목 (대화에서 언급된 것만):
- 주요 논의 주제
- 결정된 사항
- 발견된 리스크·이슈
- 다음 할 일

한국어로 작성하세요.`;

    const aiText = await callGemini(systemPrompt, `채팅 내용 (${messages.length}개 메세지):\n\n${chatText}`);

    const label = mode === "minutes" ? "회의록" : "AI 요약";
    const { data: saved } = await supabase.from("messages")
      .insert({ project_id: id, member_name: label, content: aiText, is_ai: true })
      .select().single();

    // 회의록만 보관함에 저장 (AI 요약은 채팅창에만 표시)
    if (mode === "minutes") {
      const now = new Date();
      const artifactTitle = `회의록 — ${now.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} ${now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
      await supabase.from("ai_artifacts").insert({
        project_id: id,
        type: "minutes",
        title: artifactTitle,
        content: { text: aiText, source_message_count: messages.length },
      });
    }

    return Response.json({ message: saved, aiText });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

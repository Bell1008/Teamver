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

    const [{ data: project }, { data: messages, error }] = await Promise.all([
      supabase.from("projects").select("title, subject, goal").eq("id", id).single(),
      supabase.from("messages").select("member_name, content, created_at")
        .eq("project_id", id).eq("is_ai", false)
        .order("created_at", { ascending: true }).limit(100),
    ]);

    if (error) throw error;
    if (!messages?.length) return Response.json({ error: "분석할 대화가 없습니다." }, { status: 400 });

    const persona = getProjectPersona(project);
    const projectCtx = `프로젝트: "${project?.title}" / 과목·도메인: ${project?.subject ?? "미정"} / 목표: ${project?.goal ?? "미정"}`;

    const chatText = messages
      .map((m) => `[${new Date(m.created_at).toLocaleString("ko-KR")}] ${m.member_name}: ${m.content}`)
      .join("\n");

    const STRICT_NOTE = `
⚠️ 중요 지침: 채팅 내용에 명확히 언급된 정보만 작성하세요. 대화에 없는 내용을 추론·가정·추측하거나 임의로 채우지 마세요. 정보가 부족한 항목은 "언급 없음" 또는 해당 항목을 생략하세요.`;

    const systemPrompt = mode === "minutes"
      ? `${persona}
${projectCtx}
${STRICT_NOTE}

위 팀플 프로젝트의 채팅 내용을 바탕으로 공식 회의록을 작성하세요.
도메인 특성을 반영한 전문 용어와 관점을 사용하세요.
대화에서 직접 확인된 내용만 포함하고, 불분명한 사항은 그대로 "불명확"으로 표기하세요.

형식:
## 회의 일시
## 참석자
## 논의 내용
  - 주요 안건별 정리 (도메인 관련 기술·용어 명확히 표기)
## 결정 사항
## 다음 할 일 (Action Items)
  - 담당자와 기한 포함 (대화에서 언급된 경우에만)

한국어로 작성하세요.`
      : `${persona}
${projectCtx}
${STRICT_NOTE}

위 팀플 프로젝트의 채팅 내용을 읽고 핵심을 4~6문장으로 간결하게 요약하세요.
도메인 관점에서 중요한 기술적 결정·용어를 정확히 표기하세요.

포함 항목 (대화에서 언급된 항목만):
- 주요 논의 주제 (도메인 특화 내용 포함)
- 결정된 사항
- 발견된 리스크나 이슈
- 다음 할 일

한국어로 작성하세요.`;

    const aiText = await callGemini(systemPrompt, `채팅 내용:\n\n${chatText}`);

    const label = mode === "minutes" ? "회의록" : "AI 요약";
    const { data: saved } = await supabase.from("messages")
      .insert({ project_id: id, member_name: label, content: aiText, is_ai: true })
      .select().single();

    // 회의록만 보관함에 저장, AI 요약은 채팅창에만 표시
    if (mode === "minutes") {
      const now = new Date();
      const artifactTitle = `회의록 — ${now.toLocaleDateString("ko-KR", { month:"numeric", day:"numeric" })} ${now.toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit" })}`;
      await supabase.from("ai_artifacts").insert({
        project_id: id, type: "minutes",
        title: artifactTitle,
        content: { text: aiText, source_message_count: messages.length },
      });
    }

    return Response.json({ message: saved });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

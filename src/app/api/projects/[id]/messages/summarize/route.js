import { supabase } from "@/lib/supabase";
import { getProjectPersona } from "@/lib/projectPersona";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function callGemini(systemPrompt, userText) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 환경변수가 없습니다.");
  const res = await fetch(`${GEMINI_API_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API 오류 (${res.status})`);
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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

    const systemPrompt = mode === "minutes"
      ? `${persona}
${projectCtx}

위 팀플 프로젝트의 채팅 내용을 바탕으로 공식 회의록을 작성하세요.
도메인 특성을 반영한 전문 용어와 관점을 사용하세요.

형식:
## 회의 일시
## 참석자
## 논의 내용
  - 주요 안건별 정리 (도메인 관련 기술·용어 명확히 표기)
## 결정 사항
## 다음 할 일 (Action Items)
  - 담당자와 기한 포함

한국어로 작성하세요.`
      : `${persona}
${projectCtx}

위 팀플 프로젝트의 채팅 내용을 읽고 핵심을 4~6문장으로 간결하게 요약하세요.
도메인 관점에서 중요한 기술적 결정·용어를 정확히 표기하세요.

포함 항목:
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

    const now = new Date();
    const artifactTitle = `${label} — ${now.toLocaleDateString("ko-KR", { month:"numeric", day:"numeric" })} ${now.toLocaleTimeString("ko-KR", { hour:"2-digit", minute:"2-digit" })}`;
    await supabase.from("ai_artifacts").insert({
      project_id: id, type: mode === "minutes" ? "minutes" : "summary",
      title: artifactTitle,
      content: { text: aiText, source_message_count: messages.length },
    });

    return Response.json({ message: saved });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

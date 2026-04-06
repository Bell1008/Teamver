import { supabase } from "@/lib/supabase";

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
    const { mode = "summary" } = await request.json(); // "summary" | "minutes"

    // 최근 메세지 100개 조회
    const { data: messages, error } = await supabase
      .from("messages")
      .select("member_name, content, created_at, is_ai")
      .eq("project_id", id)
      .eq("is_ai", false)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;
    if (!messages?.length) return Response.json({ error: "분석할 대화가 없습니다." }, { status: 400 });

    const chatText = messages
      .map((m) => `[${new Date(m.created_at).toLocaleString("ko-KR")}] ${m.member_name}: ${m.content}`)
      .join("\n");

    const systemPrompt = mode === "minutes"
      ? `당신은 팀 회의록 작성 전문가입니다. 아래 팀 채팅 내용을 바탕으로 공식적인 회의록을 작성해주세요.
회의록 형식:
## 회의 일시
## 참석자
## 논의 내용
  - 주요 안건별로 정리
## 결정 사항
## 다음 할 일 (Action Items)

한국어로 작성하고, 중요한 내용을 빠짐없이 담아주세요.`
      : `당신은 팀 협업 도우미입니다. 아래 팀 채팅 내용을 읽고 핵심을 3~5문장으로 간결하게 요약해주세요.
- 주요 논의 주제
- 결정된 사항
- 다음 할 일

한국어로 자연스럽게 작성해주세요.`;

    const aiText = await callGemini(systemPrompt, `다음은 팀 채팅 내용입니다:\n\n${chatText}`);

    const label = mode === "minutes" ? "📋 회의록" : "🤖 AI 요약";

    // AI 메세지로 저장
    const { data: saved } = await supabase
      .from("messages")
      .insert({
        project_id: id,
        member_name: label,
        content: aiText,
        is_ai: true,
      })
      .select()
      .single();

    return Response.json({ message: saved });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

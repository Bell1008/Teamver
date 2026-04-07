import { supabase } from "@/lib/supabase";
import { getProjectPersona } from "@/lib/projectPersona";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function getApiKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  return k;
}

// domain_persona는 userPrompt에 포함되어 AI가 읽음
const SYSTEM_PROMPT = `You are a domain expert and project manager AI for Teamver.
Use the domain_persona field in the user input as your primary persona and expertise lens.
Analyze the provided team project data and generate a comprehensive contribution and health report in Korean.

Scoring guidelines:
- contribution_score (0-100): weighted sum of task completion(40%), task avg progress(30%), file uploads(15%), chat activity(15%)
- Be fair and objective. If someone has 0 tasks but contributed files/chats, reflect that.
- highlights: 1-3 positive observations per member
- concerns: 0-2 constructive improvement points (empty array if none)

Output ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "summary": "3-4 sentence overall project health assessment in Korean",
  "overall_health": "good",
  "team_dynamic": "1-2 sentence team collaboration assessment in Korean",
  "member_analysis": [
    {
      "member_id": "string",
      "name": "string",
      "contribution_score": 75,
      "highlights": ["Korean string"],
      "concerns": []
    }
  ],
  "risks": [
    { "level": "high", "description": "Korean string" }
  ],
  "priorities": [
    { "rank": 1, "description": "Korean string" }
  ]
}
overall_health must be exactly one of: "good", "warning", "critical"
risk level must be exactly one of: "high", "medium", "low"`;

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    // 모든 프로젝트 데이터 병렬 fetch
    const [
      { data: project, error: pErr },
      { data: members, error: mErr },
      { data: tasks },
      { data: files },
      { data: messages },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("members").select("*").eq("project_id", id).eq("is_ai", false),
      supabase.from("tasks").select("*").eq("project_id", id),
      supabase.from("project_files").select("*").eq("project_id", id),
      supabase.from("messages").select("member_name, content, created_at").eq("project_id", id).eq("is_ai", false).order("created_at", { ascending: false }).limit(50),
    ]);

    if (pErr) throw pErr;
    if (mErr) throw mErr;
    if (!members?.length) return Response.json({ error: "참여한 팀원이 없습니다." }, { status: 400 });

    const allTasks = tasks ?? [];
    const allFiles = files ?? [];
    const allMessages = messages ?? [];

    // 멤버별 통계 계산 (프론트 차트용)
    const memberStats = members.map((m) => {
      const myTasks = allTasks.filter((t) => t.member_id === m.id);
      const doneTasks = myTasks.filter((t) => t.status === "done").length;
      const avgProgress = myTasks.length
        ? Math.round(myTasks.reduce((s, t) => s + (t.progress ?? 0), 0) / myTasks.length)
        : 0;
      const taskCompletionRate = myTasks.length ? Math.round((doneTasks / myTasks.length) * 100) : 0;
      const filesCount = allFiles.filter((f) => f.member_name === m.name).length;
      const msgCount = allMessages.filter((msg) => msg.member_name === m.name).length;

      return {
        member_id: m.id,
        name: m.name,
        role: m.role ?? "미배정",
        task_total: myTasks.length,
        task_done: doneTasks,
        task_completion_rate: taskCompletionRate,
        avg_progress: avgProgress,
        files_count: filesCount,
        messages_count: msgCount,
        task_titles: myTasks.slice(0, 5).map((t) => `${t.title}(${t.progress ?? 0}%)`),
      };
    });

    const persona = getProjectPersona(project);

    // Gemini 프롬프트 조립
    const userPrompt = JSON.stringify({
      domain_persona: persona,
      project: {
        title: project.title,
        goal: project.goal,
        subject: project.subject,
        duration: project.duration_unit ? `${project.duration_value}${project.duration_unit}` : "기한 없음",
        kickoff_done: allTasks.length > 0,
      },
      member_stats: memberStats,
      files_summary: allFiles.map((f) => ({
        name: f.name,
        category: f.category,
        uploaded_by: f.member_name ?? "unknown",
      })),
      recent_messages: allMessages.slice(0, 30).reverse().map((m) => `[${m.member_name}] ${m.content}`),
    });

    const res = await fetch(`${GEMINI_API_URL}?key=${getApiKey()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) throw new Error(`Gemini API 오류 (${res.status})`);
    const raw = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let aiResult;
    try {
      aiResult = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      aiResult = m ? JSON.parse(m[0]) : {};
    }

    // memberStats와 AI 분석 병합하여 반환
    const mergedMembers = memberStats.map((ms) => {
      const ai = aiResult.member_analysis?.find((a) => a.member_id === ms.member_id || a.name === ms.name) ?? {};
      return { ...ms, contribution_score: ai.contribution_score ?? ms.task_completion_rate, highlights: ai.highlights ?? [], concerns: ai.concerns ?? [] };
    });

    const report = {
      summary: aiResult.summary ?? "분석을 완료했습니다.",
      overall_health: aiResult.overall_health ?? "warning",
      team_dynamic: aiResult.team_dynamic ?? "",
      member_analysis: mergedMembers,
      risks: aiResult.risks ?? [],
      priorities: aiResult.priorities ?? [],
      generated_at: new Date().toISOString(),
    };

    // 보관함 자동 저장
    const now = new Date();
    const title = `집계 리포트 — ${now.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} ${now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
    await supabase.from("ai_artifacts").insert({ project_id: id, type: "aggregate", title, content: report });

    return Response.json(report);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

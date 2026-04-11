import { supabase } from "@/lib/supabase";
import { getProjectPersona } from "@/lib/projectPersona";

const GEMINI_MODELS = [
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
];

async function callGeminiJSON(systemPrompt, userText) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });
  for (const url of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(`${url}?key=${key}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
      });
      if (res.ok) {
        const raw = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
        try { return JSON.parse(raw); } catch {
          const m = raw.match(/\{[\s\S]*\}/);
          return m ? JSON.parse(m[0]) : {};
        }
      }
      if (res.status === 429 || res.status === 503) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1500));
        continue;
      }
      break;
    }
  }
  throw new Error("AI 서비스가 일시적으로 사용 불가합니다. 잠시 후 다시 시도해주세요.");
}

// domain_persona는 userPrompt에 포함되어 AI가 읽음
const SYSTEM_PROMPT = `You are a domain expert and project manager AI for a student team project platform.
Use the domain_persona field in the user input as your primary expertise lens.
Analyze the provided team data and generate a comprehensive health report in Korean.

⚠️ Only reference facts from the provided data. Do not infer or fabricate information.

Scoring guidelines (0-100):
- contribution_score: task_completion(35%) + avg_progress(25%) + journal_entries(20%) + file_uploads(10%) + chat_activity(10%)
- If data is missing for a category, score that category as 0.
- highlights: 1-3 specific, evidence-based observations per member
- concerns: 0-2 specific, constructive points (empty array if none)

Output ONLY valid JSON matching this exact schema (no markdown, no extra text):
{
  "summary": "3-4 sentence overall project health assessment in Korean (facts only)",
  "overall_health": "good",
  "team_dynamic": "1-2 sentence team collaboration assessment in Korean (facts only)",
  "member_analysis": [
    {
      "member_id": "string",
      "name": "string",
      "contribution_score": 75,
      "highlights": ["Korean string based on actual data"],
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

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 30); // 최근 30일 기여 기록
    const weekCutoff = weekAgo.toISOString().split("T")[0];

    const [
      { data: project, error: pErr },
      { data: members, error: mErr },
      { data: tasks },
      { data: files },
      { data: messages },
      { data: contribLogs },
      { data: milestones },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("members").select("*").eq("project_id", id).eq("is_ai", false),
      supabase.from("tasks").select("*").eq("project_id", id),
      supabase.from("project_files").select("*").eq("project_id", id),
      supabase.from("messages").select("member_name, content, created_at")
        .eq("project_id", id).eq("is_ai", false)
        .order("created_at", { ascending: false }).limit(100),
      supabase.from("contribution_logs")
        .select("member_id, date, achievement_rate, completed_tasks, members(name)")
        .eq("project_id", id)
        .gte("date", weekCutoff)
        .order("date", { ascending: false }),
      supabase.from("milestones").select("week, title, tasks").eq("project_id", id).order("week"),
    ]);

    if (pErr) throw pErr;
    if (mErr) throw mErr;
    if (!members?.length) return Response.json({ error: "참여한 팀원이 없습니다." }, { status: 400 });

    const allTasks = tasks ?? [];
    const allFiles = files ?? [];
    const allMessages = messages ?? [];
    const allLogs = contribLogs ?? [];

    // 멤버별 통계 계산
    const memberStats = members.map((m) => {
      const myTasks = allTasks.filter((t) => t.member_id === m.id);
      const doneTasks = myTasks.filter((t) => t.status === "done").length;
      const avgProgress = myTasks.length
        ? Math.round(myTasks.reduce((s, t) => s + (t.progress ?? 0), 0) / myTasks.length)
        : 0;
      const taskCompletionRate = myTasks.length ? Math.round((doneTasks / myTasks.length) * 100) : 0;
      const filesCount = allFiles.filter((f) => f.member_name === m.name).length;
      const msgCount = allMessages.filter((msg) => msg.member_name === m.name).length;
      const myLogs = allLogs.filter((l) => l.member_id === m.id || l.members?.name === m.name);
      const avgAchievement = myLogs.length
        ? Math.round(myLogs.reduce((s, l) => s + (l.achievement_rate ?? 0), 0) / myLogs.length * 100)
        : 0;
      const journalEntries = myLogs.length;

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
        journal_entries: journalEntries,
        avg_achievement: avgAchievement,
        task_titles: myTasks.slice(0, 5).map((t) => `${t.title}(${t.progress ?? 0}%)`),
        recent_tasks_done: myLogs.slice(0, 3).flatMap((l) => l.completed_tasks ?? []).slice(0, 5),
      };
    });

    const persona = getProjectPersona(project);
    const msCtx = milestones?.length
      ? milestones.map((m) => `Week ${m.week}: ${m.title}`).join(", ")
      : "마일스톤 없음";

    const userPrompt = JSON.stringify({
      domain_persona: persona,
      project: {
        title: project.title,
        goal: project.goal,
        subject: project.subject,
        duration: project.duration_unit ? `${project.duration_value}${project.duration_unit}` : "기한 없음",
        milestones: msCtx,
        kickoff_done: allTasks.length > 0,
      },
      member_stats: memberStats,
      files_summary: allFiles.map((f) => ({
        name: f.name,
        category: f.category,
        uploaded_by: f.member_name ?? "unknown",
      })),
      recent_messages: allMessages.slice(0, 50).reverse().map((m) => `[${m.member_name}] ${m.content}`),
    });

    const aiResult = await callGeminiJSON(SYSTEM_PROMPT, userPrompt);

    // memberStats와 AI 분석 병합
    const mergedMembers = memberStats.map((ms) => {
      const ai = aiResult.member_analysis?.find((a) => a.member_id === ms.member_id || a.name === ms.name) ?? {};
      return {
        ...ms,
        contribution_score: ai.contribution_score ?? ms.task_completion_rate,
        highlights: ai.highlights ?? [],
        concerns: ai.concerns ?? [],
      };
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

import { supabase } from "@/lib/supabase";
import { getProjectPersona } from "@/lib/projectPersona";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const BASE_PROMPT = `당신은 프로젝트의 도메인 전문가이자 경험 많은 PM입니다.
입력의 domain_persona 값을 당신의 페르소나로 사용하세요.

팀플 프로젝트의 현재 진행 상황을 분석하고 다음 마일스톤을 생성해주세요.

규칙:
- 기존 마일스톤·할 일 완료도·미완료 작업을 정밀 분석하여 실현 가능한 다음 단계를 설계하세요.
- 이미 완료된 것은 제외하고, 부족하거나 미진한 부분을 보완하세요.
- 마일스톤은 프로젝트 목표·과목·성격을 반영해 구체적으로 작성하세요.
- 태스크는 4~6개, 팀이 실제 실행할 수 있는 행동 단위로 작성하세요.
- 반드시 JSON만 출력, 마크다운 없음.

출력 형식:
{
  "week": <다음 주차 번호>,
  "title": "마일스톤 제목 (한국어)",
  "tasks": ["구체적인 태스크1", "태스크2", ...]
}`;

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    const [
      { data: project },
      { data: milestones },
      { data: tasks },
      { data: planningDocs },
      { data: messages },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("milestones").select("*").eq("project_id", id).order("week"),
      supabase.from("tasks").select("*").eq("project_id", id),
      supabase.from("project_files").select("name, description").eq("project_id", id).eq("category", "planning"),
      supabase.from("messages").select("member_name, content").eq("project_id", id).eq("is_ai", false)
        .order("created_at", { ascending: false }).limit(30),
    ]);

    const allTasks = tasks ?? [];
    const doneTasks = allTasks.filter((t) => t.status === "done");
    const inProgressTasks = allTasks.filter((t) => t.status !== "done" && (t.progress ?? 0) > 0);
    const notStarted = allTasks.filter((t) => t.status !== "done" && (t.progress ?? 0) === 0);
    const maxWeek = milestones?.reduce((m, ms) => Math.max(m, ms.week), 0) ?? 0;

    const completedMilestones = (milestones ?? []).filter((ms) =>
      ms.tasks.length > 0 && ms.tasks.every((_, i) => (ms.completed_tasks ?? []).includes(i))
    );

    const persona = getProjectPersona(project);
    const userPrompt = JSON.stringify({
      domain_persona: persona,
      project: {
        title: project?.title,
        goal: project?.goal,
        subject: project?.subject,
        duration: project?.duration_unit ? `${project.duration_value}${project.duration_unit}` : "기한 없음",
        planning_docs: planningDocs?.map((d) => d.name).join(", ") || "없음",
      },
      existing_milestones: (milestones ?? []).map((ms) => ({
        week: ms.week,
        title: ms.title,
        tasks: ms.tasks,
        completed_count: (ms.completed_tasks ?? []).length,
        total_count: ms.tasks.length,
      })),
      fully_completed_milestones: completedMilestones.map((m) => m.title),
      task_summary: {
        total: allTasks.length,
        done: doneTasks.length,
        in_progress: inProgressTasks.length,
        not_started: notStarted.length,
        avg_progress: allTasks.length
          ? Math.round(allTasks.reduce((s, t) => s + (t.progress ?? 0), 0) / allTasks.length)
          : 0,
        done_titles: doneTasks.slice(0, 10).map((t) => t.title),
        pending_titles: notStarted.slice(0, 10).map((t) => t.title),
      },
      recent_discussion: (messages ?? []).slice(0, 15).reverse().map((m) => `[${m.member_name}] ${m.content}`),
      next_week_number: maxWeek + 1,
    });

    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY 환경변수가 없습니다.");

    const res = await fetch(`${GEMINI_API_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: BASE_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.35, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) throw new Error(`Gemini API 오류 (${res.status})`);
    const raw = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let generated;
    try { generated = JSON.parse(raw); }
    catch { const m = raw.match(/\{[\s\S]*\}/); generated = m ? JSON.parse(m[0]) : null; }

    if (!generated?.title || !generated?.tasks?.length)
      throw new Error("AI 응답 파싱 실패");

    // DB 저장
    const week = generated.week ?? maxWeek + 1;
    const { data: newMs, error: insertErr } = await supabase
      .from("milestones")
      .insert({ project_id: id, week, title: generated.title, tasks: generated.tasks, completed_tasks: [] })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return Response.json(newMs, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

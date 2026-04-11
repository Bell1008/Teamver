import { supabase } from "@/lib/supabase";
import { callKickoffAgent } from "@/services/gemini";
import { getProjectPersona } from "@/lib/projectPersona";

export async function POST(request) {
  try {
    const { project_id } = await request.json();
    if (!project_id)
      return Response.json({ error: "project_id가 필요합니다." }, { status: 400 });

    // DB에서 프로젝트 + 멤버 + 기획안 + 보관함 기록 조회
    const [{ data: project, error: pErr }, { data: members, error: mErr }, { data: planningDocs }, { data: prevArtifacts }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", project_id).single(),
      supabase.from("members").select("*").eq("project_id", project_id).eq("is_ai", false),
      supabase.from("project_files").select("name, description").eq("project_id", project_id).eq("category", "planning"),
      supabase.from("ai_artifacts").select("type, title, content, created_at").eq("project_id", project_id)
        .in("type", ["kickoff", "aggregate", "journal"])
        .order("created_at", { ascending: false }).limit(8),
    ]);
    if (pErr) throw pErr;
    if (mErr) throw mErr;
    if (!members?.length)
      return Response.json({ error: "참여한 팀원이 없습니다." }, { status: 400 });

    // 기획안 컨텍스트 생성
    const planningContext = planningDocs?.length
      ? planningDocs.map((d, i) => `[기획안 ${i+1}] ${d.name}${d.description ? `: ${d.description}` : ""}`).join("\n")
      : null;

    const persona = getProjectPersona(project);

    // 보관함 컨텍스트 — 이전 킥오프, 팀 분석, 일지를 요약해 참고
    const archiveCtx = prevArtifacts?.length
      ? prevArtifacts.map((a) => {
          if (a.type === "kickoff") {
            const roles = a.content?.role_assignments?.map((r) => `${r.member_name}→${r.role}`).join(", ") ?? "";
            return `[이전 킥오프 ${a.title}] 역할 배정: ${roles}`;
          }
          if (a.type === "aggregate") {
            return `[팀 분석 ${a.title}] 건강도: ${a.content?.overall_health ?? "unknown"} / ${(a.content?.summary ?? "").slice(0, 120)}`;
          }
          if (a.type === "journal") {
            return `[팀 일지 ${a.title}] ${(a.content?.text ?? "").slice(0, 200)}`;
          }
          return null;
        }).filter(Boolean).join("\n")
      : "없음";

    const result = await callKickoffAgent({
      project: {
        title: project.title,
        goal: project.goal,
        subject: project.subject,
        duration_weeks: project.duration_weeks,
        planning_documents: planningContext ?? "없음",
        domain_persona: persona,
        team_history: archiveCtx,
      },
      members: members.map((m) => ({ name: m.name, skills: m.skills, personality: m.personality })),
      ai_members: [],
    });

    // 역할/책임 업데이트
    for (const ra of result.role_assignments) {
      const member = members.find((m) => m.name === ra.member_name);
      if (!member) continue;
      await supabase.from("members").update({ role: ra.role, responsibilities: ra.responsibilities }).eq("id", member.id);
    }

    // 마일스톤 저장 (기존 삭제 후 재생성)
    await supabase.from("milestones").delete().eq("project_id", project_id);
    const { error: msErr } = await supabase.from("milestones").insert(
      result.milestones.map((ms) => ({ project_id, week: ms.week, title: ms.title, tasks: ms.tasks }))
    );
    if (msErr) throw msErr;

    // 보관함 자동 저장
    const now = new Date();
    const title = `킥오프 — ${now.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })} ${now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
    await supabase.from("ai_artifacts").insert({
      project_id,
      type: "kickoff",
      title,
      content: {
        role_assignments: result.role_assignments,
        milestones: result.milestones,
        member_count: members.length,
      },
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import { supabase } from "@/lib/supabase";
import { callKickoffAgent } from "@/services/gemini";
export async function POST(request) {
  try {
    const { project_id, project, members, ai_members } = await request.json();
    if (!project_id || !project || !members) return Response.json({ error: "project_id, project, members 필드가 필요합니다." }, { status: 400 });
    const result = await callKickoffAgent({ project, members, ai_members: ai_members??[] });
    const { error: e1 } = await supabase.from("members").insert([...result.role_assignments.map(ra => { const m=members.find(x=>x.name===ra.member_name)??{}; return { project_id, name:ra.member_name, skills:m.skills??[], personality:m.personality??"", is_ai:false, role:ra.role, responsibilities:ra.responsibilities }; }), ...(result.ai_member_config??[]).map(ai => ({ project_id, name:ai.name, skills:[], personality:ai.prompt_persona, is_ai:true, role:ai.role, responsibilities:[] }))]);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from("milestones").insert(result.milestones.map(ms => ({ project_id, week:ms.week, title:ms.title, tasks:ms.tasks })));
    if (e2) throw e2;
    return Response.json(result, { status: 201 });
  } catch (err) { return Response.json({ error: err.message }, { status: 500 }); }
}

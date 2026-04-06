import { supabase } from "@/lib/supabase";
import { callWeeklyReviewAgent } from "@/services/gemini";
export async function POST(request) {
  try {
    const { project_id, week } = await request.json();
    if (!project_id || !week) return Response.json({ error: "project_id, week 필드가 필요합니다." }, { status: 400 });
    const { data: ms, error: e1 } = await supabase.from("milestones").select("*").eq("project_id",project_id).lte("week",week).order("week");
    if (e1) throw e1;
    const { data: logs, error: e2 } = await supabase.from("contribution_logs").select("member_id,completed_tasks,achievement_rate,members(name)").eq("project_id",project_id);
    if (e2) throw e2;
    const map = {};
    for (const l of logs) { const n=l.members?.name??"unknown"; if(!map[n]) map[n]={member_name:n,completed_tasks:[],total_rate:0,count:0}; map[n].completed_tasks.push(...(l.completed_tasks??[])); map[n].total_rate+=l.achievement_rate??0; map[n].count++; }
    const result = await callWeeklyReviewAgent({ current_week:week, milestones:ms.map(m=>({week:m.week,title:m.title,tasks:m.tasks,completed_tasks:[]})), contribution_logs:Object.values(map).map(m=>({member_name:m.member_name,completed_tasks:m.completed_tasks.slice(0,10),daily_achievement_rate:m.count>0?m.total_rate/m.count:0})) });
    const { data: review, error: e3 } = await supabase.from("weekly_reviews").insert({ project_id, week, diagnosis:result.diagnosis, risks:result.risks, priorities:result.next_week_priorities }).select().single();
    if (e3) throw e3;
    return Response.json(review, { status: 201 });
  } catch (err) { return Response.json({ error: err.message }, { status: 500 }); }
}

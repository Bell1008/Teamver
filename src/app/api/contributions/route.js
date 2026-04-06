import { supabase } from "@/lib/supabase";
export async function POST(request) {
  try {
    const { member_id, project_id, date, completed_tasks, memo, achievement_rate } = await request.json();
    if (!member_id || !project_id) return Response.json({ error: "member_id, project_id 필드가 필요합니다." }, { status: 400 });
    const { data, error } = await supabase.from("contribution_logs").insert({ member_id, project_id, date:date??new Date().toISOString().split("T")[0], completed_tasks:completed_tasks??[], memo:memo??"", achievement_rate:achievement_rate??0 }).select().single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) { return Response.json({ error: err.message }, { status: 500 }); }
}

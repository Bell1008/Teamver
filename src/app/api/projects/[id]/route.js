import { supabase } from "@/lib/supabase";
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [p, m, ms] = await Promise.all([supabase.from("projects").select("*").eq("id",id).single(), supabase.from("members").select("*").eq("project_id",id), supabase.from("milestones").select("*").eq("project_id",id).order("week")]);
    if (p.error) throw p.error;
    return Response.json({ project: p.data, members: m.data??[], milestones: ms.data??[] });
  } catch (err) { return Response.json({ error: err.message }, { status: 500 }); }
}

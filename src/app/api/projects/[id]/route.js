import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [p, m, ms] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("members").select("*").eq("project_id", id).order("joined_at"),
      supabase.from("milestones").select("*").eq("project_id", id).order("week"),
    ]);
    if (p.error) throw p.error;
    return Response.json({ project: p.data, members: m.data ?? [], milestones: ms.data ?? [] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowed = ["theme_bg", "theme_accent", "title", "goal", "subject", "duration_value", "duration_unit", "duration_weeks"];
    const updates = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(updates).length === 0)
      return Response.json({ error: "변경할 필드가 없습니다." }, { status: 400 });

    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

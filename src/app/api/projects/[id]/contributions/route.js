import { supabase } from "@/lib/supabase";

// GET /api/projects/[id]/contributions — 기여 로그 + 멤버 이름
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get("date"); // YYYY-MM-DD, optional

    let query = supabase
      .from("contribution_logs")
      .select("id, member_id, date, completed_tasks, memo, achievement_rate, history, created_at, members(name, user_id)")
      .eq("project_id", id)
      .order("date", { ascending: false })
      .limit(100);

    if (dateFilter) query = query.eq("date", dateFilter);

    const { data, error } = await query;
    if (error) throw error;

    // Flatten members join
    const flat = (data ?? []).map((row) => ({
      id: row.id,
      member_id: row.member_id,
      member_name: row.members?.name ?? "알 수 없음",
      user_id: row.members?.user_id,
      date: row.date,
      completed_tasks: row.completed_tasks ?? [],
      memo: row.memo,
      achievement_rate: row.achievement_rate ?? 0,
      history: row.history ?? [],
      created_at: row.created_at,
    }));

    return Response.json(flat);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

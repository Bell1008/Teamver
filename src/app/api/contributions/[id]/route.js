import { supabase } from "@/lib/supabase";

// PATCH /api/contributions/[id]
// body: { completed_tasks, memo, achievement_rate, requesterId (member_id) }
// 현재 값을 history에 스냅샷으로 저장한 뒤 새 값으로 업데이트
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { completed_tasks, memo, achievement_rate, requesterId } = body;

    // 현재 row 조회
    const { data: current, error: fetchErr } = await supabase
      .from("contribution_logs")
      .select("member_id, completed_tasks, memo, achievement_rate, history")
      .eq("id", id)
      .single();
    if (fetchErr || !current) return Response.json({ error: "기여 기록을 찾을 수 없습니다." }, { status: 404 });

    // 본인 확인 (member_id 기준)
    if (requesterId && current.member_id !== requesterId)
      return Response.json({ error: "본인 기록만 수정할 수 있습니다." }, { status: 403 });

    // 현재 값을 history 배열에 스냅샷으로 저장
    const snapshot = {
      completed_tasks: current.completed_tasks,
      memo: current.memo ?? "",
      achievement_rate: current.achievement_rate,
      saved_at: new Date().toISOString(),
    };
    const newHistory = [...(current.history ?? []), snapshot];

    const updates = {};
    if (completed_tasks !== undefined) updates.completed_tasks = completed_tasks;
    if (memo          !== undefined) updates.memo = memo;
    if (achievement_rate !== undefined) updates.achievement_rate = Number(achievement_rate);
    updates.history = newHistory;

    const { data, error } = await supabase
      .from("contribution_logs")
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

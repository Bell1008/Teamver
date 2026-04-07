import { supabase } from "@/lib/supabase";

// PATCH — 마일스톤 제목·태스크 목록·완료 인덱스 수정
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const allowed = ["title", "tasks", "completed_tasks"];
    const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length)
      return Response.json({ error: "변경할 필드가 없습니다." }, { status: 400 });
    const { data, error } = await supabase.from("milestones").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — 마일스톤 삭제
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

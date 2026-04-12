import { supabase } from "@/lib/supabase";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowed = ["name", "skills", "personality", "role"];
    const updates = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(updates).length === 0)
      return Response.json({ error: "변경할 필드가 없습니다." }, { status: 400 });

    const { data, error } = await supabase
      .from("members")
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

// DELETE /api/members/[id]?requesterId=userId  — 방장이 멤버 내보내기
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get("requesterId");
    if (!requesterId) return Response.json({ error: "requesterId 필요" }, { status: 400 });

    // 대상 멤버의 project_id 조회
    const { data: target, error: tErr } = await supabase
      .from("members").select("project_id, user_id").eq("id", id).single();
    if (tErr || !target) return Response.json({ error: "멤버를 찾을 수 없습니다." }, { status: 404 });

    // 요청자가 해당 프로젝트 방장인지 확인
    const { data: project } = await supabase
      .from("projects").select("owner_id").eq("id", target.project_id).single();
    if (project?.owner_id !== requesterId)
      return Response.json({ error: "방장만 멤버를 내보낼 수 있습니다." }, { status: 403 });

    // 방장 본인은 내보낼 수 없음
    if (target.user_id === requesterId)
      return Response.json({ error: "본인을 내보낼 수 없습니다." }, { status: 400 });

    const { error: delErr } = await supabase.from("members").delete().eq("id", id);
    if (delErr) throw delErr;

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

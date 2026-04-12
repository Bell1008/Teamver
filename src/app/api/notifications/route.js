import { supabase } from "@/lib/supabase";

// GET /api/notifications?userId=X  → 최신 60건
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId 필요" }, { status: 400 });

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) throw error;
    return Response.json(data ?? []);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/notifications?userId=X  body: { ids: "all" | string[] }  → 읽음 처리
export async function PATCH(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId 필요" }, { status: 400 });

    const { ids } = await request.json();

    let q = supabase.from("notifications").update({ is_read: true }).eq("user_id", userId);
    if (ids !== "all" && Array.isArray(ids) && ids.length) {
      q = q.in("id", ids);
    }

    const { error } = await q;
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/notifications?id=X&userId=Y  → 단건 삭제
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id     = searchParams.get("id");
    const userId = searchParams.get("userId");
    if (!id || !userId) return Response.json({ error: "id, userId 필요" }, { status: 400 });

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

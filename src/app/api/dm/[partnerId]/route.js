import { supabase } from "@/lib/supabase";

// GET /api/dm/[partnerId]?userId=<uuid>  — 두 사람 사이의 메시지 목록
export async function GET(request, { params }) {
  try {
    const { partnerId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId가 필요합니다." }, { status: 400 });

    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`
      )
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw error;
    return Response.json(data ?? []);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/dm/[partnerId]  — 읽음 처리
export async function PATCH(request, { params }) {
  try {
    const { partnerId } = await params;
    const { userId } = await request.json();
    if (!userId) return Response.json({ error: "userId가 필요합니다." }, { status: 400 });

    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("sender_id", partnerId)
      .eq("recipient_id", userId)
      .eq("read", false);

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

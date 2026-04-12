import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";

// PATCH /api/friends/requests/[id]  → { action: "accept" | "reject" | "cancel" }
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { action } = await request.json();
    if (!["accept", "reject", "cancel"].includes(action))
      return Response.json({ error: "action은 accept | reject | cancel 중 하나" }, { status: 400 });

    // accept 알림을 위해 먼저 레코드 조회
    let requestRow = null;
    if (action === "accept") {
      const { data } = await supabase
        .from("friend_requests").select("sender_id, recipient_id").eq("id", id).single();
      requestRow = data;
    }

    const newStatus = action === "accept" ? "accepted" : "rejected";
    const { error } = action === "cancel"
      ? await supabase.from("friend_requests").delete().eq("id", id)
      : await supabase.from("friend_requests").update({ status: newStatus }).eq("id", id);

    if (error) throw error;

    // 수락 시 요청자에게 알림
    if (action === "accept" && requestRow) {
      const { data: accepterProfile } = await supabase
        .from("profiles").select("username").eq("id", requestRow.recipient_id).single();
      const accepterName = accepterProfile?.username ?? "누군가";
      await notify(requestRow.sender_id, "friend_accept", "친구 요청이 수락됐습니다", `${accepterName}님과 친구가 됐습니다!`, "/home?tab=messages");
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

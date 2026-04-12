import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";

// GET /api/friends?userId=X            → 친구 목록 (accepted)
// GET /api/friends?userId=X&otherId=Y  → 두 사람 관계 상태
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId  = searchParams.get("userId");
    const otherId = searchParams.get("otherId");
    if (!userId) return Response.json({ error: "userId 필요" }, { status: 400 });

    // 관계 상태 단건 조회
    if (otherId) {
      const { data } = await supabase
        .from("friend_requests")
        .select("id, sender_id, recipient_id, status")
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
        .single();

      if (!data) return Response.json({ status: "none" });
      if (data.status === "accepted") return Response.json({ status: "accepted", id: data.id });
      if (data.status === "rejected") return Response.json({ status: "none" }); // 거절된 건 없는 것처럼
      if (data.sender_id === userId) return Response.json({ status: "pending_sent", id: data.id });
      return Response.json({ status: "pending_received", id: data.id });
    }

    // 친구 목록
    const { data: rows, error } = await supabase
      .from("friend_requests")
      .select("id, sender_id, recipient_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    if (error) throw error;

    const friendIds = (rows ?? []).map((r) => r.sender_id === userId ? r.recipient_id : r.sender_id);
    if (!friendIds.length) return Response.json([]);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", friendIds);

    const { data: memberRows } = await supabase
      .from("members")
      .select("user_id, name")
      .in("user_id", friendIds);

    const nameMap = {};
    for (const m of memberRows ?? []) {
      if (!nameMap[m.user_id]) nameMap[m.user_id] = [];
      if (!nameMap[m.user_id].includes(m.name)) nameMap[m.user_id].push(m.name);
    }

    const friends = (profiles ?? []).map((p) => ({
      id: p.id,
      username: p.username,
      memberNames: nameMap[p.id] ?? [],
    }));

    return Response.json(friends);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/friends  → 친구 요청 전송
export async function POST(request) {
  try {
    const { senderId, recipientId } = await request.json();
    if (!senderId || !recipientId) return Response.json({ error: "senderId, recipientId 필요" }, { status: 400 });
    if (senderId === recipientId) return Response.json({ error: "자기 자신에게는 요청할 수 없습니다." }, { status: 400 });

    // 이미 관계가 있는지 확인
    const { data: existing } = await supabase
      .from("friend_requests")
      .select("id, status")
      .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`)
      .single();

    if (existing) {
      if (existing.status === "accepted") return Response.json({ error: "이미 친구입니다." }, { status: 409 });
      if (existing.status === "pending")  return Response.json({ error: "이미 요청을 보냈거나 받은 상태입니다." }, { status: 409 });
      // rejected → 재전송 가능 (upsert)
      const { data, error } = await supabase
        .from("friend_requests")
        .update({ status: "pending", sender_id: senderId, recipient_id: recipientId })
        .eq("id", existing.id)
        .select().single();
      if (error) throw error;
      return Response.json(data, { status: 201 });
    }

    const { data, error } = await supabase
      .from("friend_requests")
      .insert({ sender_id: senderId, recipient_id: recipientId })
      .select().single();
    if (error) throw error;

    // 수신자에게 알림
    const { data: senderProfile } = await supabase
      .from("profiles").select("username").eq("id", senderId).single();
    const senderName = senderProfile?.username ?? "누군가";
    await notify(recipientId, "friend_request", "친구 요청이 왔습니다", `${senderName}님이 친구 요청을 보냈습니다.`, "/home?tab=messages");

    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/friends?userId=X&friendId=Y  → 친구 삭제
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId   = searchParams.get("userId");
    const friendId = searchParams.get("friendId");
    if (!userId || !friendId) return Response.json({ error: "userId, friendId 필요" }, { status: 400 });

    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

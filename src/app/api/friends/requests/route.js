import { supabase } from "@/lib/supabase";

// GET /api/friends/requests?userId=X → { received: [...], sent: [...] }
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId 필요" }, { status: 400 });

    const { data: rows, error } = await supabase
      .from("friend_requests")
      .select("id, sender_id, recipient_id, status, created_at")
      .eq("status", "pending")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const received = (rows ?? []).filter((r) => r.recipient_id === userId);
    const sent     = (rows ?? []).filter((r) => r.sender_id    === userId);

    // 프로필 조회
    const otherIds = [...new Set([
      ...received.map((r) => r.sender_id),
      ...sent.map((r) => r.recipient_id),
    ])];
    if (!otherIds.length) return Response.json({ received: [], sent: [] });

    // 나의 프로젝트 목록 조회 (공유 프로젝트만 이름 표시)
    const { data: myProjectRows } = await supabase
      .from("members").select("project_id").eq("user_id", userId);
    const myProjectIds = (myProjectRows ?? []).map((r) => r.project_id);

    const [{ data: profiles }, { data: memberRows }] = await Promise.all([
      supabase.from("profiles").select("id, username").in("id", otherIds),
      myProjectIds.length
        ? supabase.from("members").select("user_id, name")
            .in("user_id", otherIds)
            .in("project_id", myProjectIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    const nameMap = {};
    for (const m of memberRows ?? []) {
      if (!nameMap[m.user_id]) nameMap[m.user_id] = [];
      if (!nameMap[m.user_id].includes(m.name)) nameMap[m.user_id].push(m.name);
    }

    const enrich = (list, idKey) => list.map((r) => {
      const uid = r[idKey];
      return { ...r, username: profileMap[uid]?.username ?? "알 수 없음", memberNames: nameMap[uid] ?? [] };
    });

    return Response.json({
      received: enrich(received, "sender_id"),
      sent:     enrich(sent,     "recipient_id"),
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

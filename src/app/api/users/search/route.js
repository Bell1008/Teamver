import { supabase } from "@/lib/supabase";

// GET /api/users/search?q=keyword&userId=myId
// → 아이디(username) 검색, 자기 자신 제외, 친구 상태 포함
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q      = (searchParams.get("q") ?? "").trim();
    const userId = searchParams.get("userId");
    if (!q || q.length < 1) return Response.json([]);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", `%${q}%`)
      .neq("id", userId ?? "")
      .limit(20);
    if (error) throw error;
    if (!profiles?.length) return Response.json([]);

    const ids = profiles.map((p) => p.id);

    // 나의 프로젝트 내 이름만 (다른 프로젝트 이름 혼입 방지)
    const { data: myProjectRows } = await supabase
      .from("members").select("project_id").eq("user_id", userId ?? "");
    const myProjectIds = (myProjectRows ?? []).map((r) => r.project_id);

    const { data: memberRows } = myProjectIds.length
      ? await supabase.from("members").select("user_id, name")
          .in("user_id", ids)
          .in("project_id", myProjectIds)
      : { data: [] };

    const nameMap = {};
    for (const m of memberRows ?? []) {
      if (!m.user_id) continue;
      if (!nameMap[m.user_id]) nameMap[m.user_id] = [];
      if (!nameMap[m.user_id].includes(m.name)) nameMap[m.user_id].push(m.name);
    }

    // 친구 요청 상태 조회
    let relationMap = {};
    if (userId) {
      const { data: reqs } = await supabase
        .from("friend_requests")
        .select("id, sender_id, recipient_id, status")
        .or(ids.map((id) => `and(sender_id.eq.${userId},recipient_id.eq.${id}),and(sender_id.eq.${id},recipient_id.eq.${userId})`).join(","));

      for (const r of reqs ?? []) {
        const otherId = r.sender_id === userId ? r.recipient_id : r.sender_id;
        if (r.status === "accepted")                    relationMap[otherId] = { status: "accepted",         id: r.id };
        else if (r.status === "pending" && r.sender_id === userId)
                                                        relationMap[otherId] = { status: "pending_sent",     id: r.id };
        else if (r.status === "pending")                relationMap[otherId] = { status: "pending_received", id: r.id };
      }
    }

    const results = profiles.map((p) => ({
      id:          p.id,
      username:    p.username,
      memberNames: nameMap[p.id] ?? [],
      relation:    relationMap[p.id]?.status ?? "none",
      requestId:   relationMap[p.id]?.id,
    }));

    return Response.json(results);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

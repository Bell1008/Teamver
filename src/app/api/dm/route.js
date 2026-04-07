import { supabase } from "@/lib/supabase";

// GET /api/dm?userId=<uuid>  — 대화 목록 (최신 메시지 + 안읽은 수)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId가 필요합니다." }, { status: 400 });

    // 내가 보내거나 받은 모든 DM
    const { data: msgs, error } = await supabase
      .from("direct_messages")
      .select("id, sender_id, recipient_id, content, read, created_at")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    // 대화 상대별로 그룹화
    const threadMap = new Map();
    for (const m of msgs ?? []) {
      const partnerId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      if (!threadMap.has(partnerId)) {
        threadMap.set(partnerId, { partnerId, lastMessage: m, unread: 0 });
      }
      if (m.recipient_id === userId && !m.read) {
        threadMap.get(partnerId).unread++;
      }
    }

    // 파트너 프로필 조회
    const partnerIds = [...threadMap.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", partnerIds.length ? partnerIds : ["00000000-0000-0000-0000-000000000000"]);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    const threads = [...threadMap.values()].map((t) => ({
      ...t,
      partnerName: profileMap[t.partnerId]?.username ?? "알 수 없음",
    }));

    return Response.json(threads);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/dm  — 메시지 전송
export async function POST(request) {
  try {
    const { sender_id, recipient_id, content } = await request.json();
    if (!sender_id || !recipient_id || !content?.trim())
      return Response.json({ error: "필수 필드가 없습니다." }, { status: 400 });

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({ sender_id, recipient_id, content: content.trim() })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

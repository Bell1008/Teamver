import { supabase } from "@/lib/supabase";

// GET /api/dm?userId=<uuid>  — 대화 목록 (최신 메시지 + 안읽은 수 + 파트너 이름)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId가 필요합니다." }, { status: 400 });

    const { data: msgs, error } = await supabase
      .from("direct_messages")
      .select("id, sender_id, recipient_id, content, read, created_at, file_name, file_type")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    // 대화 상대별 그룹화
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

    const partnerIds = [...threadMap.keys()];
    if (!partnerIds.length) return Response.json([]);

    // 프로필(username) + 멤버 이름 병렬 조회
    const [{ data: profiles }, { data: theirMembers }] = await Promise.all([
      supabase.from("profiles").select("id, username").in("id", partnerIds),
      supabase.from("members").select("name, user_id").in("user_id", partnerIds),
    ]);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    // 파트너별 멤버 이름 목록
    const memberNameMap = {};
    for (const m of theirMembers ?? []) {
      if (!memberNameMap[m.user_id]) memberNameMap[m.user_id] = [];
      if (!memberNameMap[m.user_id].includes(m.name)) memberNameMap[m.user_id].push(m.name);
    }

    const threads = [...threadMap.values()].map((t) => ({
      ...t,
      username:    profileMap[t.partnerId]?.username ?? "알 수 없음",
      memberNames: memberNameMap[t.partnerId] ?? [],
    }));

    return Response.json(threads);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/dm?userId=<uuid>&unread=1  — 총 안읽은 수만
export async function HEAD(request) {
  return new Response(null, { status: 200 });
}

// POST /api/dm  — 메시지 전송
export async function POST(request) {
  try {
    const { sender_id, recipient_id, content, file_url, file_name, file_type, file_size } = await request.json();
    if (!sender_id || !recipient_id || (!content?.trim() && !file_url))
      return Response.json({ error: "필수 필드가 없습니다." }, { status: 400 });

    const row = {
      sender_id,
      recipient_id,
      content: content?.trim() || (file_name ?? "파일"),
    };
    if (file_url)  { row.file_url = file_url; row.file_name = file_name; row.file_type = file_type; row.file_size = file_size; }

    const { data, error } = await supabase.from("direct_messages").insert(row).select().single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

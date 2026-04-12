import { supabase } from "@/lib/supabase";

// GET /api/dm/[partnerId]/profile?userId=<uuid>
// 파트너 프로필: username, 공유 팀플, 각자 팀플 이름, 첫 연락일
export async function GET(request, { params }) {
  try {
    const { partnerId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return Response.json({ error: "userId가 필요합니다." }, { status: 400 });

    const [
      { data: partnerProfile },
      { data: myMembers },
      { data: theirMembers },
      { data: firstDm },
    ] = await Promise.all([
      supabase.from("profiles").select("id, username").eq("id", partnerId).single(),
      supabase.from("members").select("name, project_id, projects(id, title)").eq("user_id", userId),
      supabase.from("members").select("name, project_id, projects(id, title)").eq("user_id", partnerId),
      supabase.from("direct_messages")
        .select("created_at")
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
        .order("created_at", { ascending: true })
        .limit(1)
        .single(),
    ]);

    // 공유 프로젝트 찾기 — project_id 기준 중복 제거 (같은 프로젝트에 여러 member 행 방지)
    const dedup = (rows) => {
      const seen = new Set();
      return (rows ?? []).filter((m) => {
        if (seen.has(m.project_id)) return false;
        seen.add(m.project_id);
        return true;
      });
    };
    const myDedupedMembers    = dedup(myMembers);
    const theirDedupedMembers = dedup(theirMembers);

    const myProjectIds = new Set(myDedupedMembers.map((m) => m.project_id));
    const sharedProjects = theirDedupedMembers
      .filter((tm) => myProjectIds.has(tm.project_id))
      .map((tm) => {
        const myM = myDedupedMembers.find((m) => m.project_id === tm.project_id);
        return {
          projectId: tm.project_id,
          projectTitle: tm.projects?.title ?? "팀플",
          myName:    myM?.name  ?? "",
          theirName: tm.name    ?? "",
        };
      });

    // 공유 프로젝트 내의 이름만 (다른 프로젝트 이름 혼입 방지)
    const theirMemberNames = [...new Set(sharedProjects.map((p) => p.theirName).filter(Boolean))];

    return Response.json({
      partnerId,
      username:        partnerProfile?.username ?? "알 수 없음",
      memberNames:     theirMemberNames,
      sharedProjects,
      firstContactAt:  firstDm?.created_at ?? null,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

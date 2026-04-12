import { supabase } from "@/lib/supabase";

/**
 * 단일 사용자에게 알림을 보냅니다.
 */
export async function notify(userId, type, title, body = null, link = null) {
  if (!userId) return;
  const { error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, type, title, body, link });
  if (error) console.error("[notify] insert failed:", error.message, { userId, type });
}

/**
 * 프로젝트 멤버 전원에게 알림을 보냅니다.
 * excludeUserId: 알림을 받지 않을 사용자 (보통 액션을 트리거한 본인)
 */
export async function notifyProjectMembers(projectId, excludeUserId, type, title, body = null, link = null) {
  const { data: members } = await supabase
    .from("members")
    .select("user_id")
    .eq("project_id", projectId)
    .not("user_id", "is", null);

  const userIds = [...new Set(
    (members ?? [])
      .map((m) => m.user_id)
      .filter((uid) => uid && uid !== excludeUserId)
  )];

  if (!userIds.length) return;

  const rows = userIds.map((user_id) => ({ user_id, type, title, body, link }));
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) console.error("[notifyProjectMembers] insert failed:", error.message, { projectId, type });
}

import { supabase } from "@/lib/supabase";

// PATCH /api/friends/requests/[id]  → { action: "accept" | "reject" | "cancel" }
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { action } = await request.json();
    if (!["accept", "reject", "cancel"].includes(action))
      return Response.json({ error: "action은 accept | reject | cancel 중 하나" }, { status: 400 });

    const newStatus = action === "accept" ? "accepted" : "rejected";
    const { error } = action === "cancel"
      ? await supabase.from("friend_requests").delete().eq("id", id)
      : await supabase.from("friend_requests").update({ status: newStatus }).eq("id", id);

    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

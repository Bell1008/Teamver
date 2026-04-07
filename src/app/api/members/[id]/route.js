import { supabase } from "@/lib/supabase";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const allowed = ["name", "skills", "personality", "role"];
    const updates = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(updates).length === 0)
      return Response.json({ error: "변경할 필드가 없습니다." }, { status: 400 });

    const { data, error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

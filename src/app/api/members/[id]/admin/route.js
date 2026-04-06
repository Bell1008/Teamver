import { supabase } from "@/lib/supabase";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { is_admin } = await request.json();

    const { data, error } = await supabase
      .from("members")
      .update({ is_admin: !!is_admin })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

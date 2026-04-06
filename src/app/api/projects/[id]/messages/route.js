import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return Response.json(data ?? []);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { member_id, member_name, content } = await request.json();

    if (!content?.trim()) return Response.json({ error: "내용을 입력해주세요." }, { status: 400 });
    if (!member_name?.trim()) return Response.json({ error: "멤버 정보가 없습니다." }, { status: 400 });

    const { data, error } = await supabase
      .from("messages")
      .insert({ project_id: id, member_id: member_id ?? null, member_name, content: content.trim(), is_ai: false })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

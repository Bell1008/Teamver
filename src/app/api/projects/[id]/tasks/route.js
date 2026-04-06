import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("tasks")
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
    const { member_id, title, description } = await request.json();
    if (!title?.trim()) return Response.json({ error: "제목을 입력해주세요." }, { status: 400 });
    if (!member_id)     return Response.json({ error: "멤버 정보가 없습니다." }, { status: 400 });

    const { data, error } = await supabase
      .from("tasks")
      .insert({ project_id: id, member_id, title: title.trim(), description: description?.trim() ?? null, status: "todo" })
      .select()
      .single();
    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

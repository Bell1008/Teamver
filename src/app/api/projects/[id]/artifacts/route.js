import { supabase } from "@/lib/supabase";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("ai_artifacts")
      .select("id, type, title, content, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return Response.json(data ?? []);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const artifactId = searchParams.get("artifactId");
    if (!artifactId) return Response.json({ error: "artifactId가 필요합니다." }, { status: 400 });
    const { error } = await supabase.from("ai_artifacts").delete().eq("id", artifactId).eq("project_id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

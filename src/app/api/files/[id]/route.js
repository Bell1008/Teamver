import { supabase } from "@/lib/supabase";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { data: file } = await supabase
      .from("project_files").select("url, storage_path").eq("id", id).single();

    if (file) {
      // storage_path 컬럼 우선, 없으면 URL에서 추출 (하위 호환)
      let path = file.storage_path ?? null;
      if (!path && file.url) {
        try {
          const url = new URL(file.url);
          path = url.pathname.split("/storage/v1/object/public/teamver/")[1] ?? null;
        } catch { /* ignore */ }
      }
      if (path) {
        await supabase.storage.from("teamver").remove([decodeURIComponent(path)]);
      }
    }

    const { error } = await supabase.from("project_files").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

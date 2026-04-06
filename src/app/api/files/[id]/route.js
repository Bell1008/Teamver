import { supabase } from "@/lib/supabase";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    // DB에서 파일 정보 조회 후 Storage에서도 삭제
    const { data: file } = await supabase.from("project_files").select("url").eq("id", id).single();

    if (file?.url) {
      // Storage path 추출 (URL에서 bucket 경로)
      try {
        const url = new URL(file.url);
        const path = url.pathname.split("/storage/v1/object/public/teamver/")[1];
        if (path) await supabase.storage.from("teamver").remove([path]);
      } catch {
        // Storage 삭제 실패해도 DB는 삭제
      }
    }

    const { error } = await supabase.from("project_files").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

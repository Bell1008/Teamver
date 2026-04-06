import { supabase } from "@/lib/supabase";

const FREE_FILE_LIMIT   = 10;
const FREE_PLANNING_LIMIT = 3;
const FREE_SIZE_LIMIT   = 20 * 1024 * 1024; // 20MB

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category"); // 'planning' | 'file' | null(=all)

    let q = supabase.from("project_files").select("*").eq("project_id", id).order("created_at", { ascending: false });
    if (category) q = q.eq("category", category);

    const { data, error } = await q;
    if (error) throw error;
    return Response.json(data ?? []);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { member_id, member_name, name, url, size, mime_type, category, description } = body;

    if (!name || !url) return Response.json({ error: "파일 정보가 부족합니다." }, { status: 400 });

    // 무료 제한 체크
    const { data: existing } = await supabase
      .from("project_files").select("id, size, category").eq("project_id", id);

    const currentFiles    = existing ?? [];
    const totalSize       = currentFiles.reduce((s, f) => s + (f.size ?? 0), 0);
    const planningCount   = currentFiles.filter((f) => f.category === "planning").length;
    const totalCount      = currentFiles.length;

    if (category === "planning" && planningCount >= FREE_PLANNING_LIMIT) {
      return Response.json({ error: "기획안은 최대 3개까지 업로드할 수 있습니다.", premium_required: true }, { status: 402 });
    }
    if (totalCount >= FREE_FILE_LIMIT) {
      return Response.json({ error: "파일은 최대 10개까지 업로드할 수 있습니다.", premium_required: true }, { status: 402 });
    }
    if (totalSize + (size ?? 0) > FREE_SIZE_LIMIT) {
      return Response.json({ error: "전체 파일 용량이 20MB를 초과합니다.", premium_required: true }, { status: 402 });
    }

    const { data, error } = await supabase.from("project_files")
      .insert({ project_id: id, member_id: member_id ?? null, member_name: member_name ?? null, name, url, size: size ?? 0, mime_type: mime_type ?? null, category: category ?? "file", description: description?.trim() ?? null })
      .select().single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

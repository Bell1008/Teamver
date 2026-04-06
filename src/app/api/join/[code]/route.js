import { supabase } from "@/lib/supabase";
import { randomBytes } from "crypto";

// 초대 코드로 프로젝트 기본 정보 조회
export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, goal, subject, duration_weeks, theme_bg, theme_accent")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (error || !data)
      return Response.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// 팀원 참여 — 본인 정보 직접 입력
export async function POST(request, { params }) {
  try {
    const { code } = await params;
    const { name, skills, personality, user_id } = await request.json();

    if (!name?.trim())
      return Response.json({ error: "이름을 입력해주세요." }, { status: 400 });

    // 초대 코드로 project_id 조회
    const { data: project, error: pErr } = await supabase
      .from("projects")
      .select("id")
      .eq("invite_code", code.toUpperCase())
      .single();

    if (pErr || !project)
      return Response.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });

    const member_code = randomBytes(8).toString("hex");

    const { data, error } = await supabase
      .from("members")
      .insert({
        project_id: project.id,
        name: name.trim(),
        skills: Array.isArray(skills) ? skills : (skills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
        personality: personality ?? "",
        is_ai: false,
        member_code,
        ...(user_id ? { user_id } : {}),
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

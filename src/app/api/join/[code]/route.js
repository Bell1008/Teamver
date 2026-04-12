import { supabase } from "@/lib/supabase";
import { randomBytes } from "crypto";
import { notifyProjectMembers } from "@/lib/notify";

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

    // 동일 user_id가 이미 이 프로젝트에 member 행을 갖고 있으면 중복 생성 방지
    if (user_id) {
      const { data: existing } = await supabase
        .from("members")
        .select("id, member_code, name")
        .eq("project_id", project.id)
        .eq("user_id", user_id)
        .limit(1)
        .single();
      if (existing) {
        // 이름이 달라졌으면 업데이트
        const updates = { name: name.trim(), skills: Array.isArray(skills) ? skills : (skills ?? "").split(",").map((s) => s.trim()).filter(Boolean), personality: personality ?? "" };
        await supabase.from("members").update(updates).eq("id", existing.id);
        return Response.json({ ...existing, ...updates }, { status: 200 });
      }
    }

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

    // 기존 멤버에게 새 팀원 참가 알림 (본인 제외)
    await notifyProjectMembers(
      project.id, user_id ?? null,
      "project_join",
      "새 팀원이 참가했습니다",
      `${name.trim()}님이 프로젝트에 참가했습니다.`,
      `/projects/${project.id}`
    );

    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

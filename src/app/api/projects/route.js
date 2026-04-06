import { supabase } from "@/lib/supabase";
import { randomBytes } from "crypto";

function genCode(len) {
  return randomBytes(len).toString("hex").slice(0, len).toUpperCase();
}

export async function POST(request) {
  try {
    const { title, goal, subject, duration_value, duration_unit, owner_id } = await request.json();
    if (!title || !goal || !subject)
      return Response.json({ error: "필수 필드 누락" }, { status: 400 });

    const invite_code = genCode(6);
    const owner_code  = genCode(12);

    // duration_weeks: 하위 호환 유지 (주 단위 환산, 기한 없음이면 null)
    const duration_weeks = !duration_unit ? 0
      : duration_unit === "hours"  ? Math.ceil(duration_value / 168)
      : duration_unit === "days"   ? Math.ceil(duration_value / 7)
      : duration_unit === "weeks"  ? duration_value
      : duration_unit === "months" ? Math.ceil(duration_value * 4.33)
      : duration_unit === "years"  ? Math.ceil(duration_value * 52)
      : 0;

    const { data, error } = await supabase
      .from("projects")
      .insert({ title, goal, subject, duration_weeks, duration_value: duration_unit ? duration_value : null, duration_unit: duration_unit ?? null, invite_code, owner_code, ...(owner_id ? { owner_id } : {}) })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

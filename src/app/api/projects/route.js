import { supabase } from "@/lib/supabase";
import { randomBytes } from "crypto";

function genCode(len) {
  return randomBytes(len).toString("hex").slice(0, len).toUpperCase();
}

export async function POST(request) {
  try {
    const { title, goal, subject, duration_weeks } = await request.json();
    if (!title || !goal || !subject || !duration_weeks)
      return Response.json({ error: "필수 필드 누락" }, { status: 400 });

    const invite_code = genCode(6);
    const owner_code  = genCode(12);

    const { data, error } = await supabase
      .from("projects")
      .insert({ title, goal, subject, duration_weeks, invite_code, owner_code })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

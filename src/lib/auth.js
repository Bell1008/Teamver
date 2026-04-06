import { supabase } from "./supabase";

const toEmail = (username) => `${username.trim().toLowerCase()}@teamver.local`;

export async function signUp(username, password) {
  const { data, error } = await supabase.auth.signUp({
    email: toEmail(username),
    password,
    options: { data: { username: username.trim() } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(username, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: toEmail(username),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

export async function updateTheme(userId, theme_bg, theme_accent) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ theme_bg, theme_accent })
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserProjects(userId) {
  // 내가 owner이거나 member인 프로젝트
  const [ownerRes, memberRes] = await Promise.all([
    supabase.from("projects").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
    supabase.from("members").select("project_id, projects(*)").eq("user_id", userId),
  ]);

  const ownerProjects = ownerRes.data ?? [];
  const joinedProjects = (memberRes.data ?? [])
    .map((m) => m.projects)
    .filter(Boolean)
    .filter((p) => p.owner_id !== userId); // 중복 제거

  const all = [...ownerProjects, ...joinedProjects];
  // id 기준 중복 제거
  return all.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
}

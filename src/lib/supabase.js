import { createClient } from "@supabase/supabase-js";
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  return createClient(url, key);
}
let _client = null;
export const supabase = new Proxy({}, { get(_, prop) { if (!_client) _client = getSupabaseClient(); return _client[prop]; } });

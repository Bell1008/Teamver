-- Migration 03: 인증 + 유저 프로필 + 테마
-- Supabase 대시보드 > SQL Editor 에서 실행
-- 실행 전: Auth > Settings > "Enable email confirmations" 비활성화 필수

-- 프로필 테이블 (유저별 테마 저장)
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username      text UNIQUE NOT NULL,
  theme_bg      text NOT NULL DEFAULT '#ffffff',
  theme_accent  text NOT NULL DEFAULT '#2563eb',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 프로필만 조회/수정" ON profiles
  FOR ALL USING (auth.uid() = id);

-- projects에 owner_id 추가
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users ON DELETE SET NULL;

-- members에 user_id 추가 (로그인 유저와 연결)
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE SET NULL;

-- 신규 가입 시 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

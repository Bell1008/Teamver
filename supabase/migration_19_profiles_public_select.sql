-- profiles 테이블에 공개 SELECT 정책 추가
-- (서버 사이드 API가 다른 유저의 username을 조회할 수 있도록)
DROP POLICY IF EXISTS "본인 프로필만 조회/수정" ON profiles;

-- SELECT는 누구나 가능 (username은 공개 정보)
CREATE POLICY "profiles_public_select" ON profiles
  FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE는 본인만
CREATE POLICY "profiles_self_write" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_self_delete" ON profiles
  FOR DELETE USING (auth.uid() = id);

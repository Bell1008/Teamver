-- =============================================
-- notifications 테이블 생성 + RLS 확정 수정
-- 이 파일 하나만 실행하면 알림이 작동합니다.
-- (이미 실행한 migration_21/22/23 있어도 중복 오류 없음)
-- =============================================

-- 1. 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text,
  link       text,
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS 활성화
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. 기존 정책 전부 제거 (이름 불일치로 중복 생성된 것 포함)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'notifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

-- 4. 정책 재생성
-- INSERT: 서버측 anon key(JWT 없음)에서도 삽입 가능
CREATE POLICY "알림 삽입 허용"
  ON public.notifications FOR INSERT WITH CHECK (true);

-- SELECT/UPDATE/DELETE: 본인 알림만
CREATE POLICY "본인 알림만 조회"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 알림만 수정"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "본인 알림만 삭제"
  ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- 5. 인덱스
CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- 6. Realtime 등록 (중복 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    RAISE NOTICE 'notifications added to supabase_realtime';
  ELSE
    RAISE NOTICE 'notifications already in supabase_realtime';
  END IF;
END $$;

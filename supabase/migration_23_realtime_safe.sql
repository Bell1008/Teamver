-- =============================================
-- Realtime publication 안전 등록 (중복 오류 방지)
-- migration_20 실행 시 "already member of publication" 오류가 났다면
-- 이 파일을 대신 실행하세요.
-- =============================================

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'messages', 'direct_messages', 'members', 'contribution_logs',
    'ai_artifacts', 'milestones', 'tasks', 'friend_requests', 'notifications'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      RAISE NOTICE 'Added % to supabase_realtime', t;
    ELSE
      RAISE NOTICE '% is already in supabase_realtime, skipping', t;
    END IF;
  END LOOP;
END $$;

-- =============================================
-- notifications RLS 확인/수정 (migration_21+22 통합)
-- =============================================

-- 기존 정책 정리
DROP POLICY IF EXISTS "본인 알림 조회/수정/삭제" ON public.notifications;
DROP POLICY IF EXISTS "알림 삽입 허용"           ON public.notifications;
DROP POLICY IF EXISTS "본인 알림만 조회"          ON public.notifications;
DROP POLICY IF EXISTS "본인 알림만 수정"          ON public.notifications;
DROP POLICY IF EXISTS "본인 알림만 삭제"          ON public.notifications;

-- 재생성 (notifications 테이블이 없으면 먼저 migration_21 실행 후 이 파일 실행)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    -- INSERT: 서버(anon key)에서도 가능
    EXECUTE 'CREATE POLICY "알림 삽입 허용" ON public.notifications FOR INSERT WITH CHECK (true)';
    -- SELECT/UPDATE/DELETE: 본인만
    EXECUTE 'CREATE POLICY "본인 알림만 조회" ON public.notifications FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "본인 알림만 수정" ON public.notifications FOR UPDATE USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "본인 알림만 삭제" ON public.notifications FOR DELETE USING (auth.uid() = user_id)';
    RAISE NOTICE 'notifications RLS policies updated';
  ELSE
    RAISE NOTICE 'notifications table not found - run migration_21 first';
  END IF;
END $$;

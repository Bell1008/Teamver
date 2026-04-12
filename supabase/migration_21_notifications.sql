-- =============================================
-- 알림 시스템
-- Supabase 대시보드 SQL Editor에서 실행하세요.
-- =============================================

-- 알림 테이블
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  -- friend_request | friend_accept | project_join | file_upload
  -- ai_kickoff | ai_organize | ai_journal | ai_minutes
  title      text        NOT NULL,
  body       text,
  link       text,       -- 클릭 시 이동할 경로 힌트 (e.g. "/home?tab=messages")
  is_read    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- INSERT: 서버(anon key, JWT 없음)에서도 삽입 가능하도록 허용
CREATE POLICY "알림 삽입 허용" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- SELECT/UPDATE/DELETE: 본인 알림만
CREATE POLICY "본인 알림만 조회" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "본인 알림만 수정" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "본인 알림만 삭제" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS notifications_user_id_idx     ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx  ON public.notifications(created_at DESC);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

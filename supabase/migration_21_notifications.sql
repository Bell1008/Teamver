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

CREATE POLICY "본인 알림 조회/수정/삭제" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS notifications_user_id_idx     ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx  ON public.notifications(created_at DESC);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

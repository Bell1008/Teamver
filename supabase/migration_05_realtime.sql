-- Migration 05: Realtime 실시간 필터링을 위한 REPLICA IDENTITY 설정
-- Supabase SQL Editor에서 실행

-- 필터 기반 realtime 구독이 작동하려면 REPLICA IDENTITY FULL 필요
ALTER TABLE members           REPLICA IDENTITY FULL;
ALTER TABLE contribution_logs REPLICA IDENTITY FULL;
ALTER TABLE messages          REPLICA IDENTITY FULL;
ALTER TABLE projects          REPLICA IDENTITY FULL;

-- Realtime publication에 테이블 추가 (이미 있으면 무시됨)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'contribution_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE contribution_logs;
  END IF;
END $$;

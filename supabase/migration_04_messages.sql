-- Migration 04: 채팅 메세지 테이블
-- Supabase 대시보드 > SQL Editor 에서 실행

CREATE TABLE IF NOT EXISTS messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  member_id    uuid REFERENCES members ON DELETE SET NULL,
  member_name  text NOT NULL,
  content      text NOT NULL,
  is_ai        boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 프로젝트 참여자 누구나 읽고 쓸 수 있음 (초대 코드 기반 접근 제어)
CREATE POLICY "messages_all" ON messages FOR ALL USING (true);

-- 실시간 구독을 위한 인덱스
CREATE INDEX IF NOT EXISTS messages_project_id_idx ON messages (project_id, created_at);

-- Migration 06: 할일 블록, 파일 저장소, 관리자 권한
-- Supabase SQL Editor에서 실행

-- 개인 할일 블록
CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES members ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'todo', -- 'todo' | 'done'
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 파일/기획안 저장소
CREATE TABLE IF NOT EXISTS project_files (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  member_id   uuid REFERENCES members ON DELETE SET NULL,
  member_name text,
  name        text NOT NULL,
  url         text NOT NULL,
  size        bigint NOT NULL DEFAULT 0,
  mime_type   text,
  category    text NOT NULL DEFAULT 'file', -- 'planning' | 'file'
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 관리자 권한
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- RLS
ALTER TABLE tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (true);
CREATE POLICY "project_files_all" ON project_files FOR ALL USING (true);

-- Realtime
ALTER TABLE tasks         REPLICA IDENTITY FULL;
ALTER TABLE project_files REPLICA IDENTITY FULL;
ALTER TABLE members       REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='project_files') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_files;
  END IF;
END $$;

-- Supabase Storage 버킷 안내:
-- Dashboard > Storage > Create Bucket > 이름: "teamver" > Public ON
-- Policies: "Allow all" for INSERT/SELECT/DELETE (anon role)

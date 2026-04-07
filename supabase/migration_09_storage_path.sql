-- Migration 09: storage_path 컬럼 추가 (Storage 파일 삭제 신뢰성)
-- Supabase 대시보드 > SQL Editor에서 실행

ALTER TABLE project_files ADD COLUMN IF NOT EXISTS storage_path text;

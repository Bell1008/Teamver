-- Migration 08: 할일 진행률 컬럼 추가
-- Supabase 대시보드 > SQL Editor에서 실행

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0
  CHECK (progress >= 0 AND progress <= 100);

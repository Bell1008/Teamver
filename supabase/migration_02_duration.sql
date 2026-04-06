-- Migration 02: 프로젝트 기간 세분화
-- Supabase 대시보드 > SQL Editor 에서 실행

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS duration_value float,
  ADD COLUMN IF NOT EXISTS duration_unit  text; -- 'hours' | 'days' | 'weeks' | 'months' | 'years' | null(기한 없음)

-- 기존 데이터 마이그레이션 (duration_weeks → duration_value/unit)
UPDATE projects
  SET duration_value = duration_weeks,
      duration_unit  = 'weeks'
  WHERE duration_weeks IS NOT NULL AND duration_unit IS NULL;

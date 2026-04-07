-- 마일스톤 태스크 달성 체크 지원
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS completed_tasks int[] NOT NULL DEFAULT '{}';

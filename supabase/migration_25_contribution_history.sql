-- contribution_logs에 수정 이력 저장 컬럼 추가
ALTER TABLE public.contribution_logs
  ADD COLUMN IF NOT EXISTS history jsonb NOT NULL DEFAULT '[]'::jsonb;

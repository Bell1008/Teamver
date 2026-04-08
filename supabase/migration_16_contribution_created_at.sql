-- contribution_logs에 created_at 추가
ALTER TABLE contribution_logs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

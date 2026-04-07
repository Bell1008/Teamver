-- AI 작업물 보관함 테이블
-- type: 'kickoff' | 'aggregate' | 'summary' | 'minutes'

CREATE TABLE IF NOT EXISTS ai_artifacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('kickoff', 'aggregate', 'summary', 'minutes')),
  title       TEXT NOT NULL,
  content     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_artifacts_project_id_idx ON ai_artifacts(project_id);
CREATE INDEX IF NOT EXISTS ai_artifacts_created_at_idx ON ai_artifacts(project_id, created_at DESC);

-- RLS
ALTER TABLE ai_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_artifacts_select" ON ai_artifacts FOR SELECT USING (true);
CREATE POLICY "ai_artifacts_insert" ON ai_artifacts FOR INSERT WITH CHECK (true);
CREATE POLICY "ai_artifacts_delete" ON ai_artifacts FOR DELETE USING (true);

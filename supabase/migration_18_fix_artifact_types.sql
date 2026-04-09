-- ai_artifacts type 제약 조건에 journal_draft, journal 추가
ALTER TABLE ai_artifacts DROP CONSTRAINT IF EXISTS ai_artifacts_type_check;
ALTER TABLE ai_artifacts ADD CONSTRAINT ai_artifacts_type_check
  CHECK (type IN ('kickoff', 'aggregate', 'summary', 'minutes', 'journal_draft', 'journal'));

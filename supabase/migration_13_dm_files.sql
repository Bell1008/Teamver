-- DM 파일 첨부 지원
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS file_url    TEXT;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS file_name   TEXT;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS file_type   TEXT;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS file_size   INT;

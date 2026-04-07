-- 개인 메시지 (DM) 테이블
CREATE TABLE IF NOT EXISTS direct_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content      TEXT NOT NULL,
  read         BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dm_sender_idx    ON direct_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dm_recipient_idx ON direct_messages(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dm_pair_idx      ON direct_messages(sender_id, recipient_id);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_all" ON direct_messages FOR ALL USING (true);

-- 친구 요청 테이블
CREATE TABLE IF NOT EXISTS friend_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | rejected
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sender_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS fr_sender_idx    ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS fr_recipient_idx ON friend_requests(recipient_id);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fr_all" ON friend_requests FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;

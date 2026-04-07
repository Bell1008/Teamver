-- =============================================
-- Migration 07: Supabase Storage bucket 생성
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- =============================================

-- teamver 버킷 생성 (공개 버킷)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'teamver',
  'teamver',
  true,
  52428800,  -- 50MB max per file
  null       -- 모든 mime type 허용
)
ON CONFLICT (id) DO NOTHING;

-- 공개 읽기 정책
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'teamver_public_read'
  ) THEN
    CREATE POLICY "teamver_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'teamver');
  END IF;
END $$;

-- 업로드 허용 정책 (anon 포함 — 초대 코드로 참여한 유저도 업로드 가능)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'teamver_upload'
  ) THEN
    CREATE POLICY "teamver_upload" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'teamver');
  END IF;
END $$;

-- 삭제 허용 정책
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'teamver_delete'
  ) THEN
    CREATE POLICY "teamver_delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'teamver');
  END IF;
END $$;

-- Migration 01: 초대 코드 + 테마 + 멤버 코드 추가
-- Supabase 대시보드 > SQL Editor 에서 실행

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS invite_code text unique,
  ADD COLUMN IF NOT EXISTS owner_code  text,
  ADD COLUMN IF NOT EXISTS theme_bg    text not null default '#ffffff',
  ADD COLUMN IF NOT EXISTS theme_accent text not null default '#2563eb';

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS member_code text unique,
  ADD COLUMN IF NOT EXISTS joined_at   timestamptz not null default now();

-- 기존 프로젝트에 코드 채우기 (새 프로젝트는 API에서 생성)
UPDATE projects
  SET invite_code = substring(md5(random()::text), 1, 6),
      owner_code  = substring(md5(random()::text), 1, 12)
  WHERE invite_code IS NULL;

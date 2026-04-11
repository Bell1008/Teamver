-- =============================================
-- Supabase Realtime 활성화
-- Supabase 대시보드 SQL Editor에서 실행하세요.
-- Database > Replication > supabase_realtime 에서도 동일하게 설정 가능합니다.
-- =============================================

-- 채팅 메시지 (팀 채팅 + AI 요약)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- DM 메시지
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- 팀원 (참가, 역할 변경, 관리자 지정)
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;

-- 기여 기록 (팀 일지 입력)
ALTER PUBLICATION supabase_realtime ADD TABLE public.contribution_logs;

-- AI 보관함 (내용 정리, 일지, 회의록, 집계 등)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_artifacts;

-- 마일스톤 (킥오프 후 생성/수정)
ALTER PUBLICATION supabase_realtime ADD TABLE public.milestones;

-- 할 일 (태스크 생성/수정/삭제)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- 친구 요청
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;

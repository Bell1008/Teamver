-- notifications 테이블 REPLICA IDENTITY FULL 설정
-- (filter 기반 realtime 구독이 정확히 동작하려면 필요)
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

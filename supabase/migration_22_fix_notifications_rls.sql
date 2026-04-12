-- =============================================
-- notifications RLS 정책 수정
-- (migration_21을 이미 실행했다면 이 파일을 추가로 실행하세요)
-- 서버 측 anon key로 INSERT할 수 있도록 정책을 분리합니다.
-- =============================================

-- 기존 통합 정책 제거
DROP POLICY IF EXISTS "본인 알림 조회/수정/삭제" ON public.notifications;

-- INSERT: 서버(anon key, JWT 없음)에서도 삽입 가능
CREATE POLICY "알림 삽입 허용" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- SELECT: 본인 알림만 조회
CREATE POLICY "본인 알림만 조회" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- UPDATE: 본인 알림만 수정 (읽음 처리)
CREATE POLICY "본인 알림만 수정" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: 본인 알림만 삭제
CREATE POLICY "본인 알림만 삭제" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

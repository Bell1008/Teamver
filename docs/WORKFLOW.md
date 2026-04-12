# WORKFLOW.md
# Teamver — 개발 워크플로우

> 각 단계는 Claude 및 Claude Code와의 AI 바이브 코딩 방식으로 진행되었다.
> 기능 요구사항을 자연어로 지시하면 AI가 코드를 생성하고,
> 개발자는 방향성·UX·데이터 구조·보안을 결정하는 역할을 담당했다.

---

## 전체 흐름

```
STEP 01. 프로젝트 초기 세팅                  ✅ 완료
STEP 02. DB 스키마 설계 및 Supabase 세팅     ✅ 완료
STEP 03. 백엔드 기반 구축                    ✅ 완료
STEP 04. 킥오프 에이전트 구현               ✅ 완료
STEP 05. 인증 및 팀 초대 기능               ✅ 완료
STEP 06. 공동 목표 대시보드 UI              ✅ 완료
STEP 07. 마일스톤·일지·채팅·집계·DM         ✅ 완료
STEP 08. AI 보관함·알림·친구 시스템         ✅ 완료
STEP 09. 반응형 UI 마무리 및 통합 테스트    ✅ 완료
STEP 10. 배포 및 제출 준비                  ✅ 완료
```

---

## STEP 01 — 프로젝트 초기 세팅 ✅

- Next.js 16 App Router 프로젝트 초기화
- TailwindCSS 4 + PostCSS 설정
- `.env.example` 작성, `.gitignore` 설정
- `docs/`, `prompts/`, `supabase/` 폴더 구조 커밋

---

## STEP 02 — DB 스키마 설계 및 Supabase 세팅 ✅

마이그레이션 파일 이력:

| 번호 | 내용 |
|---|---|
| 01 | invite_code, owner_code, theme 컬럼 추가 |
| 02 | duration_value, duration_unit (기간 단위 확장) |
| 03 | profiles 테이블, owner_id/user_id, 회원가입 트리거 |
| 04 | messages (팀 채팅) |
| 05 | Realtime REPLICA IDENTITY FULL 설정 |
| 06 | tasks, project_files, is_admin 컬럼 |
| 07 | Supabase Storage teamver 버킷 |
| 08 | tasks.progress 컬럼 |
| 09 | project_files.storage_path 컬럼 |
| 10 | ai_artifacts 테이블 |
| 11 | milestones.completed_tasks (int[]) |
| 12 | direct_messages 테이블 |
| 13 | direct_messages 파일 첨부 컬럼 |
| 14 | direct_messages Realtime 활성화 |
| 15~18 | ai_artifacts type 확장 (journal_draft, journal) |
| 19 | profiles 공개 SELECT 정책 |
| 20~26 | notifications, friend_requests, Realtime 안전 등록 |

---

## STEP 03 — 백엔드 기반 구축 ✅

- `src/lib/supabase.js`: Proxy 패턴으로 빌드 타임 환경변수 오류 우회
- `src/services/gemini.js`: `callKickoffAgent()`, `callWeeklyReviewAgent()` 분리, JSON 파싱 실패 fallback 포함
- `src/lib/projectPersona.js`: 9개 도메인 자동 감지 페르소나 시스템
- `src/lib/notify.js`: 단건/프로젝트 전체 알림 유틸리티

---

## STEP 04 — 킥오프 에이전트 구현 ✅

- `prompts/kickoff-agent.txt` 확정 (도메인 페르소나 주입, 마일스톤 품질 가이드라인, team_history 반영)
- `POST /api/kickoff`: DB에서 팀원·기획안·이전 아티팩트 조회 → Gemini → members 역할 + milestones DB 저장 → ai_artifacts 자동 저장
- 킥오프 재실행 (커스텀 confirm 다이얼로그, 기존 마일스톤 삭제 후 재생성)

**검토 및 수정:** `duration_weeks` NOT NULL 오류 → 기한 없음 선택 시 0 삽입으로 해결. Gemini 응답 파싱에서 마크다운 코드블록 포함 응답 처리 정규식 추가.

---

## STEP 05 — 인증 및 팀 초대 기능 구현 ✅

- Supabase Auth (`username@teamver.local` 내부 변환 방식)
- 초대 코드 6자리 자동 발급
- `/join/[code]`: 동일 user_id가 이미 참여한 경우 중복 생성 방지 (upsert 처리)
- `user_id` 기반 신원 확인으로 localStorage 의존 제거

---

## STEP 06 — 공동 목표 대시보드 UI 구현 ✅

- 물방울 테마: `.page-water` 파란 그라디언트 배경, `.btn-jelly` spring 효과, `.input-drop` 포커스 glow
- 프로젝트 헤더: D-day 카운터, 진행 주차 바
- 팀원 컴팩트 칩 행: 본인 클릭 → 프로필 수정, 타인 클릭 → 프로필 보기·친구 요청·DM
- `MilestonesSection`: 주차별 로드맵, 태스크 체크박스, 진행률 바, AI 다음 마일스톤
- `TasksSection`: TaskBlock (체크박스·펼치기·진행률 슬라이더·메모), 600ms debounce 자동저장

---

## STEP 07 — 마일스톤·일지·채팅·집계·DM 구현 ✅

### 팀 일지 (좌측 패널)

- `JournalPanel`: 좌측 슬라이드인 패널, spring 애니메이션
- 기여 기록 입력 (완료 작업, 메모, 달성률 슬라이더)
- 기여 기록 수정 + 히스토리 스냅샷 (이전 버전 열람 가능)
- AI 내용 정리 → `journal_draft`, AI 일지 만들기 → `journal` 아티팩트

### 팀 채팅 (우측 패널)

- `ChatPanel`: 우측 슬라이드인 패널, Realtime 구독
- AI 요약(채팅창 표시) / AI 회의록(보관함 저장 + 팀원 알림)
- 관리자 전용 AI 버튼 (LockIcon으로 비관리자에게 명시)

### AI 집계 에이전트

- `AggregateReport` 모달: 팀 건강도 배지, 기여도 순위 바 차트, 멤버별 카드
- 기여도 점수 = task_completion(35%) + avg_progress(25%) + journal_entries(20%) + file_uploads(10%) + chat_activity(10%)

### 개인 메시지(DM)

- `MessagesTab`: 대화 목록 + 실시간 메시지 + 미읽 뱃지
- Optimistic update로 메시지 즉시 표시 후 서버 저장 시 id 동기화
- 파일·이미지 첨부 (Supabase Storage `dm/{userId}/` 경로)
- 파트너 프로필 모달: 함께한 팀플, 첫 연락일, 친구 관계 표시

---

## STEP 08 — AI 보관함·알림·친구 시스템 ✅

### AI 보관함

- `AIArchive`: 킥오프·집계·회의록·팀일지 타입별 필터
- `DetailModal`: 타입별 렌더링 (KickoffContent, AggregateContent, MarkdownContent)

### 알림 시스템

- `notifications` 테이블 + RLS (INSERT: 서버 anon key 허용, SELECT/UPDATE/DELETE: 본인만)
- `NotificationsTab`: 타입별 아이콘, 실시간 구독, 읽음 처리, 개별 삭제
- 홈 사이드바 탭 미읽 뱃지 (DM + 알림 별도 카운팅)
- `notifyProjectMembers()`: 프로젝트 멤버 전원 알림 발송 유틸

### 친구 시스템

- `friend_requests` 테이블 (pending/accepted/rejected)
- 유저명 검색 + 친구 요청/수락/거절/취소/삭제
- 검색 결과에 관계 상태 실시간 반영

### 기타 완성 요소

- `DialogProvider`: 커스텀 confirm/alert 다이얼로그 (spring 애니메이션, 위험 액션 danger 스타일)
- 기여 기록 수정 이력: PATCH 시 현재 값을 `history` 배열에 스냅샷으로 보존
- 멤버 내보내기: 방장 전용, 본인 내보내기 방지, 내보내진 멤버 자동 리다이렉트

---

## STEP 09 — 반응형 UI 마무리 및 통합 테스트 ✅

- 전체 사용자 플로우 통합 테스트 완료
- 모바일 반응형 점검 (채팅·일지 패널 오버레이, 사이드바 아이콘 모드)
- 에러 상태 처리 확인 (Gemini API 실패, Supabase 연결 오류)
- 불필요한 console.log 제거

---

## STEP 10 — 배포 및 제출 준비 ✅

- Vercel 배포 (환경변수 대시보드 입력)
- GitHub 저장소 최종 점검 (`.env` 미포함 확인)
- `docs/` 폴더 전체 문서 최신화
- 공모전 제출물 준비 완료

---

## 개발 과정에서 얻은 인사이트

| 패턴 | 내용 |
|---|---|
| 역할 분리 | 기획·문서는 Claude, 코드는 Claude Code로 역할을 나누니 각 AI의 강점이 극대화됨 |
| 제약 조건 명시 | "무료 API만 사용", "혼자 개발" 등 제약을 먼저 제시하니 현실적인 방향 제안이 나옴 |
| 스키마 먼저 설계 | 코드 작성 전 입출력 JSON 스키마를 AI와 함께 먼저 정의하니 개발 방향이 명확해짐 |
| 점진적 기능 확장 | 기본 CRUD → 실시간 → AI → 권한 → UX 순으로 레이어를 쌓아 각 단계 검증 후 다음 진행 |
| UI 언어 통일 | "물방울·쫀득" 같은 감각적 키워드를 고정 레퍼런스로 사용하니 AI가 일관된 디자인 방향 유지 |

| 주의 사항 | 내용 |
|---|---|
| 보안 로직 직접 검토 | API 키 관리, 인증 로직은 AI 생성 코드를 그대로 사용하지 않고 반드시 직접 검토 |
| localStorage 과의존 금지 | 초기 신원 인식을 localStorage에만 의존했다가 방장 인식 실패 버그 발생 → DB 기반 검증이 우선 |
| DB 마이그레이션 체크리스트 | 기능 추가 시 SQL 마이그레이션 미실행 시 런타임 에러 발생 |

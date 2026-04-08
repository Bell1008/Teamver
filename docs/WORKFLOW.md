# WORKFLOW.md
# Teamver — 개발 워크플로우

> 각 단계는 Claude Code와의 AI 바이브 코딩 방식으로 진행되었다.
> 기능 요구사항을 자연어로 지시하면 AI가 코드를 생성하고,
> 개발자는 방향성·UX·데이터 구조를 결정하는 역할을 담당했다.

---

## 전체 흐름

```
STEP 01. 프로젝트 초기 세팅            ✅ 완료
    |
STEP 02. DB 스키마 설계 및 Supabase 세팅  ✅ 완료
    |
STEP 03. 백엔드 기반 구축               ✅ 완료
    |
STEP 04. 킥오프 에이전트 구현           ✅ 완료
    |
STEP 05. 인증 및 팀 초대 기능           ✅ 완료
    |
STEP 06. 공동 목표 대시보드 UI          ✅ 완료
    |
STEP 07. 마일스톤·일지·채팅·집계·DM     ✅ 완료
    |
STEP 08. AI 보관함 및 보조 기능 완성    ✅ 완료
    |
STEP 09. 반응형 UI 마무리 및 통합 테스트  🔲 진행 중
    |
STEP 10. 배포 및 제출 준비             🔲 대기
```

---

## STEP 01 — 프로젝트 초기 세팅 ✅

**목표** : 개발 환경 구성 및 저장소 초기화

- [x] GitHub 저장소 생성 (public)
- [x] Next.js 16 App Router 프로젝트 초기화
- [x] TailwindCSS 4 설치 및 CSS 변수 설정
- [x] `.env.example` 작성
- [x] `.gitignore` 설정
- [x] `docs/`, `prompts/`, `supabase/` 폴더 구조 커밋

---

## STEP 02 — DB 스키마 설계 및 Supabase 세팅 ✅

**목표** : 전체 데이터 구조 확정 및 Supabase 프로젝트 연결

마이그레이션 파일 이력 (`supabase/migration_01~14.sql`):

| 번호 | 내용 |
|---|---|
| 01 | projects, members, milestones, tasks, contribution_logs 기본 테이블 |
| 02 | RLS 정책, 인덱스 |
| 03 | messages (팀 채팅) |
| 04~06 | profiles, planning_docs, files |
| 07~09 | invite_code, is_admin, user_id FK |
| 10 | ai_artifacts (AI 보관함) |
| 11 | milestones.completed_tasks (int[]) |
| 12 | direct_messages (개인 DM) |
| 13 | direct_messages 파일 첨부 컬럼 |
| 14 | direct_messages Realtime 활성화 |

- [x] Supabase 프로젝트 생성 및 환경변수 연결
- [x] `src/lib/supabase.js` lazy proxy 초기화
- [x] `src/lib/auth.js` 인증 헬퍼

---

## STEP 03 — 백엔드 기반 구축 ✅

**목표** : Next.js API Routes 구조 수립 및 Gemini 서비스 레이어 구현

- [x] `callGemini()` 유틸 함수 (각 API 라우트 내 선언)
- [x] JSON 파싱 실패 시 명시적 에러 반환
- [x] `src/lib/projectPersona.js` — 도메인 페르소나 감지 (9개 도메인)
- [x] 환경변수 로드 확인

---

## STEP 04 — 킥오프 에이전트 구현 ✅

**목표** : 프로젝트 생성 플로우 완성 (입력 → AI 설계 → DB 저장)

- [x] `prompts/kickoff-agent.txt` 확정 (도메인 페르소나 주입, 마일스톤 품질 가이드라인)
- [x] 프로젝트 생성 폼 (`/projects/new`)
- [x] `POST /api/kickoff` — Gemini 호출 → 역할 + 마일스톤 DB 저장
- [x] 킥오프 재실행 (커스텀 confirm 다이얼로그)
- [x] 킥오프 결과 프로젝트 대시보드에 반영

---

## STEP 05 — 인증 및 팀 초대 기능 구현 ✅

**목표** : 팀원이 각자 접속하여 본인 영역을 수정할 수 있는 구조 구현

- [x] Supabase Auth (이메일 회원가입·로그인)
- [x] `profiles` 테이블 연동 (username)
- [x] 초대 코드 생성 및 복사
- [x] `/join/[code]` — 초대 링크 접속 시 프로젝트 자동 참여
- [x] 방장(owner) / 관리자(admin) 권한 분리
- [x] `user_id` 기반 신원 확인 (auth.users.id)

---

## STEP 06 — 공동 목표 대시보드 UI 구현 ✅

**목표** : 팀 전체가 실시간으로 공유하는 메인 화면 구현

- [x] 프로젝트 헤더 (목표, D-day, 진행 주차 바)
- [x] 팀원 아이콘 행 + 프로필 모달 (스킬, 성향, 역할)
- [x] Supabase Realtime 구독 (멤버 참여 알림)
- [x] `MilestonesSection` — 주차별 로드맵, 태스크 체크박스, 진행률 바, AI 다음 마일스톤
- [x] `TasksSection` — 할일 카드, 진행률 슬라이더, 담당자 배정
- [x] `PlanningDocs` — 기획안 파일 업로드·조회
- [x] `FilesSection` — 파일 자료실
- [x] 프로젝트 수정·삭제 (방장 전용)

---

## STEP 07 — 마일스톤·일지·채팅·집계·DM 구현 ✅

**목표** : 서비스의 핵심 AI 기능 및 커뮤니케이션 전체 완성

### 팀 일지 (좌측 패널)
- [x] `JournalPanel` — 좌측 슬라이드인 패널
- [x] 기여 기록 입력 폼 (완료 작업, 메모, 달성률 슬라이더)
- [x] `GET /api/projects/[id]/contributions` — 날짜별 기여 조회
- [x] `POST /api/projects/[id]/journal/organize` — AI 내용 정리 → journal_draft
- [x] `POST /api/projects/[id]/journal/create` — AI 일지 만들기 → journal artifact

### 팀 채팅 (우측 패널)
- [x] `ChatPanel` — 우측 슬라이드인 패널, Realtime 구독
- [x] AI 요약 (채팅창 표시, 보관함 저장 안 함)
- [x] AI 회의록 → ai_artifacts (type: minutes) 저장

### AI 집계 에이전트
- [x] `POST /api/projects/[id]/aggregate` — 기여·마일스톤·역할 종합 분석
- [x] `AggregateReport` 모달 — 팀 건강도, 리스크, 우선순위

### 개인 메시지 (DM)
- [x] `direct_messages` 테이블 + Realtime
- [x] `MessagesTab` — 대화 목록, 실시간 메시지, 미읽 뱃지
- [x] 파일·이미지 첨부 (Supabase Storage)
- [x] 파트너 프로필 모달 (함께한 팀플, 첫 연락일)
- [x] 여러 팀플에서 만난 상대 → 단일 대화창, 팀플명 병기
- [x] 홈 로비 메시지 탭 미읽 뱃지

---

## STEP 08 — AI 보관함 및 보조 기능 완성 ✅

- [x] `AIArchive` — 킥오프·집계·회의록·팀일지 타입별 필터, 펼치기·삭제
- [x] `DialogProvider` — 커스텀 confirm/alert 다이얼로그 (spring 애니메이션)
- [x] `MyInfoTab` — 내 정보 (username 수정, 계정 ID)
- [x] `SettingsTab` — 설정 분리 (테마, 알림 준비 중)
- [x] 도메인 페르소나 — 킥오프·집계·일지·회의록·마일스톤 전 에이전트 적용

---

## STEP 09 — 반응형 UI 마무리 및 통합 테스트 🔲

- [ ] 전체 사용자 플로우 통합 테스트 (생성 → 킥오프 → 일지 → 회의록 → 집계)
- [ ] 모바일 반응형 점검 (주요 화면 5개)
- [ ] 에러 상태 처리 확인 (API 실패, 네트워크 오류)
- [ ] 불필요한 console.log 제거
- [ ] 환경변수 누락 여부 최종 점검
- [ ] Supabase 마이그레이션 14개 전부 실행 확인

---

## STEP 10 — 배포 및 제출 준비 🔲

- [ ] Vercel 배포 (환경변수 대시보드 입력)
- [ ] GitHub 저장소 최종 점검 (`.env` 미포함, API 키 하드코딩 검색)
- [ ] `docs/` 폴더 전체 문서 최신화 확인
- [ ] 공모전 제출물 준비
  - [ ] GitHub 저장소 주소 (public 확인)
  - [ ] 배포된 라이브 URL
  - [ ] AI 리포트 PDF 변환

---

## 개발 방식 메모

이 프로젝트는 Claude Code와의 AI 바이브 코딩으로 진행되었다.
각 단계에서 기능 요구사항과 설계 의도를 자연어로 전달하면
Claude Code가 컴포넌트, API 라우트, DB 쿼리, 스타일링 코드를 생성하고
개발자는 UX 피드백과 방향성 결정을 담당했다.
프롬프트 설계(도메인 페르소나, JSON 스키마 등)도 AI와 협력해 반복 개선하였다.

# WORKFLOW.md
# Teamver — 개발 워크플로우

> 각 단계 완료 후 작업 일지를 작성하여 `docs/ai-collaboration-log.md` 4번 섹션에 추가한다.

---

## 전체 흐름

```
STEP 01. 프로젝트 초기 세팅
    |
STEP 02. DB 스키마 설계 및 Supabase 세팅
    |
STEP 03. 백엔드 기반 구축 (서버 + Gemini 서비스 레이어)
    |
STEP 04. 킥오프 에이전트 구현 및 테스트
    |
STEP 05. 인증 및 팀 초대 기능 구현
    |
STEP 06. 공동 목표 대시보드 UI 구현
    |
STEP 07. 기여도 추적 보드 구현
    |
STEP 08. 주간 리뷰 에이전트 구현 및 테스트
    |
STEP 09. 반응형 UI 마무리 및 통합 테스트
    |
STEP 10. 배포 및 제출 준비
```

---

## STEP 01 — 프로젝트 초기 세팅

**목표** : 개발 환경 구성 및 저장소 초기화

**작업 목록**

- [ ] GitHub 저장소 생성 (public)
- [ ] Next.js 프로젝트 초기화 (`npx create-next-app`)
- [ ] TailwindCSS 설치 및 설정
- [ ] `.env.example` 작성 (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- [ ] `.gitignore` 설정 (`.env` 포함 확인)
- [ ] `docs/` 폴더 및 문서 파일 커밋
- [ ] `prompts/` 폴더 생성 및 프롬프트 파일 초안 커밋
- [ ] README.md 커밋

**완료 기준** : `npm run dev` 실행 시 로컬 서버 정상 구동

---

## STEP 02 — DB 스키마 설계 및 Supabase 세팅

**목표** : 전체 데이터 구조 확정 및 Supabase 프로젝트 연결

**작업 목록**

- [ ] Supabase 프로젝트 생성
- [ ] 아래 테이블 생성 및 관계 설정

```
projects
  - id (uuid, PK)
  - title (text)
  - goal (text)
  - subject (text)
  - duration_weeks (int)
  - created_at (timestamp)

members
  - id (uuid, PK)
  - project_id (uuid, FK → projects)
  - name (text)
  - skills (text[])
  - personality (text)
  - is_ai (boolean)
  - role (text)
  - responsibilities (text[])

milestones
  - id (uuid, PK)
  - project_id (uuid, FK → projects)
  - week (int)
  - title (text)
  - tasks (text[])

contribution_logs
  - id (uuid, PK)
  - member_id (uuid, FK → members)
  - project_id (uuid, FK → projects)
  - date (date)
  - completed_tasks (text[])
  - memo (text)
  - achievement_rate (float)

weekly_reviews
  - id (uuid, PK)
  - project_id (uuid, FK → projects)
  - week (int)
  - diagnosis (text)
  - risks (text[])
  - priorities (jsonb)
  - created_at (timestamp)
```

- [ ] Supabase 환경변수 `.env`에 입력
- [ ] `src/lib/supabase.js` 클라이언트 초기화 파일 생성
- [ ] 연결 테스트 (간단한 select 쿼리 확인)

**완료 기준** : Supabase 대시보드에서 전체 테이블 확인, 연결 테스트 통과

---

## STEP 03 — 백엔드 기반 구축

**목표** : API 라우터 구조 수립 및 Gemini 서비스 레이어 구현

**작업 목록**

- [ ] `src/services/gemini.js` 생성
  - `callKickoffAgent(input)` 함수
  - `callWeeklyReviewAgent(input)` 함수
  - JSON 파싱 실패 시 fallback 처리 포함
- [ ] API 라우트 초안 생성
  - `POST /api/projects` — 프로젝트 생성
  - `POST /api/kickoff` — 킥오프 에이전트 호출
  - `POST /api/review` — 주간 리뷰 에이전트 호출
  - `GET /api/projects/:id` — 프로젝트 조회
  - `POST /api/contributions` — 기여 로그 입력
- [ ] 환경변수 로드 확인 (`process.env.GEMINI_API_KEY`)
- [ ] Gemini API 단순 호출 테스트 (hello world 수준)

**완료 기준** : `/api/kickoff` 테스트 호출 시 Gemini로부터 JSON 응답 수신 확인

---

## STEP 04 — 킥오프 에이전트 구현 및 테스트

**목표** : 프로젝트 생성 플로우 완성 (입력 → AI 설계 → DB 저장)

**작업 목록**

- [ ] 킥오프 system prompt 최종 확정 (`prompts/kickoff-agent.txt`)
- [ ] 프로젝트 생성 폼 UI 구현
  - 프로젝트 기본 정보 입력
  - 팀원 추가 (이름, 스킬, 성향)
  - AI 팀원 추가 옵션
- [ ] 킥오프 API 라우트 완성
  - 입력 조립 → Gemini 호출 → 응답 파싱 → DB 저장
- [ ] 응답 결과 미리보기 화면 구현 (역할 분배안 + 마일스톤 확인)
- [ ] 확정 버튼 클릭 시 DB 최종 저장
- [ ] few-shot 예시 2개 이상 테스트하여 출력 품질 확인

**완료 기준** : 팀원 3명 입력 → 역할 분배 + 4주 마일스톤 정상 생성 및 DB 저장 확인

---

## STEP 05 — 인증 및 팀 초대 기능 구현

**목표** : 팀원이 각자 접속하여 본인 영역을 수정할 수 있는 구조 구현

**작업 목록**

- [ ] Supabase Auth 설정 (이메일 또는 소셜 로그인)
- [ ] 프로젝트 초대 링크 생성 기능
  - 링크 접속 시 프로젝트 참여 처리
- [ ] 팀원 본인 확인 로직 (로그인 사용자 ↔ members 테이블 연결)
- [ ] 미로그인 사용자 접근 차단 처리
- [ ] 프로젝트 목록 페이지 (본인이 속한 프로젝트만 표시)

**완료 기준** : 초대 링크로 접속한 팀원이 로그인 후 프로젝트에 정상 참여

---

## STEP 06 — 공동 목표 대시보드 UI 구현

**목표** : 팀 전체가 실시간으로 공유하는 메인 화면 구현

**작업 목록**

- [ ] 대시보드 레이아웃 설계
  - 프로젝트 목표 및 전체 진행률
  - 현재 주차 마일스톤 및 태스크 목록
  - 팀원별 역할 카드
  - 마감일 D-day 표시
- [ ] Supabase 실시간 구독 연결 (팀원 기여 입력 시 즉시 반영)
- [ ] 마일스톤 태스크 완료 체크 기능
- [ ] 전체 진행률 자동 계산 (완료 태스크 / 전체 태스크)
- [ ] 반응형 레이아웃 적용 (모바일 대응)

**완료 기준** : 팀원 A가 태스크 완료 체크 시 팀원 B 화면에 실시간 반영 확인

---

## STEP 07 — 기여도 추적 보드 구현

**목표** : 팀원별 일일 기여 입력 및 타임라인 시각화

**작업 목록**

- [ ] 일일 기여 입력 폼
  - 완료한 작업 입력 (태그 형식)
  - 메모 입력
  - 오늘 할당치 달성 여부 체크
- [ ] 기여 로그 DB 저장 (`contribution_logs` 테이블)
- [ ] 팀원별 기여 타임라인 뷰 구현
- [ ] 주차별 달성률 집계 뷰 구현
  - 팀원별 달성률 시각화 (프로그레스 바 또는 차트)
- [ ] 본인 기여 내용만 수정 가능하도록 권한 처리

**완료 기준** : 기여 입력 → 타임라인 반영 → 달성률 집계 정상 동작 확인

---

## STEP 08 — 주간 리뷰 에이전트 구현 및 테스트

**목표** : 주간 리뷰 기능 완성 (기여 집계 → AI 진단 → 결과 표시)

**작업 목록**

- [ ] 주간 리뷰 system prompt 최종 확정 (`prompts/weekly-review-agent.txt`)
- [ ] 주간 리뷰 API 라우트 완성
  - DB에서 해당 주차 기여 로그 집계 (요약본)
  - Gemini 호출 → 응답 파싱 → DB 저장
- [ ] 주간 리뷰 결과 화면 구현
  - 진행 상황 진단 텍스트
  - 감지된 리스크 목록
  - 팀원별 다음 주 우선순위
- [ ] 달성률 0.5 미만 팀원 리스크 플래그 표시 확인
- [ ] 주간 리뷰 이력 보기 기능 (이전 주 리뷰 조회)

**완료 기준** : 1주차 기여 로그 입력 후 주간 리뷰 실행 시 진단 + 리스크 + 우선순위 정상 출력

---

## STEP 09 — 반응형 UI 마무리 및 통합 테스트

**목표** : 전체 기능 연결 확인 및 UI 완성도 확보

**작업 목록**

- [ ] 전체 사용자 플로우 통합 테스트
  - 프로젝트 생성 → 킥오프 → 기여 입력 → 주간 리뷰 전 과정
- [ ] 모바일 반응형 점검 (주요 화면 5개)
- [ ] 에러 상태 처리 확인 (API 실패, 네트워크 오류, 빈 입력)
- [ ] 로딩 상태 UI 처리 (AI 호출 중 스피너 등)
- [ ] 불필요한 console.log 제거
- [ ] 환경변수 누락 여부 최종 점검

**완료 기준** : 처음 접속한 사람이 안내 없이 프로젝트 생성부터 주간 리뷰까지 완주 가능

---

## STEP 10 — 배포 및 제출 준비

**목표** : 라이브 URL 확보 및 공모전 제출물 완성

**작업 목록**

- [ ] Vercel 배포 (프론트엔드 + API Routes)
  - 환경변수 Vercel 대시보드에 입력
  - 배포 후 라이브 URL 확인
- [ ] GitHub 저장소 최종 점검
  - `.env` 파일 미포함 확인
  - API 키 하드코딩 전체 검색 (`grep -r "AIza" .`)
  - `docs/` 폴더 전체 문서 최신 상태 확인
  - `docs/ai-collaboration-log.md` 개발 단계 로그 업데이트
- [ ] 공모전 제출물 준비
  - [ ] GitHub 저장소 주소 (public 확인)
  - [ ] 배포된 라이브 URL
  - [ ] AI 리포트 PDF 변환 (`docs/ai-report.md` 기준)
  - [ ] 개인정보 수집/이용 동의서 및 참가 각서 서명

**완료 기준** : 4개 제출물 전부 준비 완료

---

## 작업 일지 작성 규칙

각 STEP 완료 후 아래 형식으로 작성하여 `docs/ai-collaboration-log.md` 4번 섹션에 추가한다.

```
### [날짜] STEP 0N — 작업명

**요청 (개발자 → Cursor)**
- 구체적 요청 내용

**Cursor 생성 결과**
- 생성된 코드/구조 요약

**검토 및 수정 사항**
- 직접 수정한 부분과 이유
```

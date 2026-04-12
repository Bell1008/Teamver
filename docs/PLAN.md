# PLAN.md
# Teamver — 학생 팀플 전용 AI 협업 설계 도구

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [문제 정의](#2-문제-정의)
3. [솔루션 설계](#3-솔루션-설계)
4. [기대 효과](#4-기대-효과)
5. [AI 활용 전략](#5-ai-활용-전략)
6. [기술 스택](#6-기술-스택)
7. [시스템 아키텍처](#7-시스템-아키텍처)
8. [AI 에이전트 명세](#8-ai-에이전트-명세)
9. [토큰 최적화 및 유지보수 전략](#9-토큰-최적화-및-유지보수-전략)
10. [프로젝트 구조](#10-프로젝트-구조)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | Teamver |
| 분류 | AI 활용 차세대 교육 솔루션 |
| 타겟 사용자 | 국내 대학교 팀 프로젝트(팀플)를 수행하는 대학생 |
| 핵심 가치 | 팀 구성 → 역할 설계 → 진행 추적 → 기여도 기록까지 하나의 플로우로 완결 |
| 서비스 내 AI | Gemini 2.5 Flash (Google AI Studio) |
| 개발 방식 | Claude 및 Claude Code와의 AI 바이브 코딩으로 기획부터 구현까지 전 과정 진행 |

---

## 2. 문제 정의

### 2-1. 대상 사용자

국내 대학교에서 학기 단위 팀 프로젝트를 반복적으로 수행하는 대학생 전반. 학기마다 새로운 팀이 구성되며 역할이 유동적인 환경의 학습자.

### 2-2. 핵심 페인 포인트

| # | 페인 포인트 | 구체적 상황 |
|---|---|---|
| 1 | 역할 불명확 | 팀 구성 직후 누가 무엇을 맡을지 정하는 데 1~2시간 소요, 갈등 발생 |
| 2 | 무임승차 | 기여도 측정 수단이 없어 불공정한 결과가 학기마다 반복됨 |
| 3 | 툴 진입 장벽 | Notion, Jira 등 기존 협업 툴은 2~8주짜리 팀플 대비 세팅 비용이 지나치게 큼 |
| 4 | AI 활용 공백 | 팀플에 AI를 활용하고 싶지만 어떻게 녹여야 할지 알 수 없음 |

### 2-3. 기존 솔루션의 한계

기존 AI 협업 툴(Asana AI, ClickUp AI, Monday.com AI 등)은 모두 기업·직장인 대상으로 설계되어 있으며, 학생 팀플의 맥락을 해결하지 못한다.

| 비교 항목 | 기업 프로젝트 툴 | 학생 팀플 현실 |
|---|---|---|
| 프로젝트 기간 | 수개월 ~ 수년 | 2 ~ 8주 |
| 팀 구성 | 고정, 역할 명확 | 매 학기 변경, 역할 유동적 |
| 최대 고통 | 리소스·일정 관리 | 무임승차 + 역할 갈등 |
| 툴 학습 비용 | 감당 가능 | 툴 세팅하다 과제 기간 종료 |

---

## 3. 솔루션 설계

### 3-1. 핵심 기능 (전체 구현 완료)

#### 기능 1 — AI 킥오프 설계자

팀원 이름·스킬셋·성향·프로젝트 목표·기간·기획안을 입력하면 Gemini가 최적 역할 분배안과 주차별 마일스톤을 자동 생성한다. 프로젝트 주제(게임·마케팅·앱·AI 등)에 따라 **도메인 페르소나**를 자동 부여하여 분야 전문성을 반영한 결과를 제공한다. 이전 킥오프 이력(팀 역할 기록, 집계 건강도, 팀 일지)을 참조하여 재실행 시 더 정밀한 설계가 가능하다.

#### 기능 2 — 마일스톤 및 할일 관리

AI 킥오프 결과로 생성된 주차별 마일스톤을 팀 전체가 공유한다. 마일스톤 내 세부 태스크를 체크박스로 완료 처리하며 진행률이 자동 계산된다. 관리자는 마일스톤을 직접 편집·삭제할 수 있고, "AI로 다음 마일스톤 생성" 버튼으로 현재 진행 상황과 기획안을 분석해 다음 단계를 자동 제안한다. 별도 할일 카드(Tasks)로 개별 작업 진행률을 슬라이더로 관리한다.

#### 기능 3 — 팀 일지 및 기여 기록

팀원이 매일 완료한 작업·메모·달성률을 자유롭게 입력한다(좌측 패널). **AI 내용 정리**는 팀 전체의 기여 내용을 도메인 특화 관점으로 구조화하며, **AI 일지 만들기**는 정리 내용들을 바탕으로 공식 팀 일지를 생성해 보관함에 자동 저장한다. 기여 기록은 수정 이력(히스토리 스냅샷)을 지원한다.

#### 기능 4 — 팀 채팅 및 회의록

팀 전체 실시간 채팅(우측 패널, Supabase Realtime). **AI 요약**은 채팅 내용을 4~6문장으로 요약해 채팅창 내에 표시하고, **AI 회의록**은 도메인 특화 형식의 공식 회의록을 작성해 보관함에 저장한다.

#### 기능 5 — AI 집계 에이전트

팀 전체 기여 로그·마일스톤 진행률·역할 현황·파일·채팅을 종합 분석한다. 팀 건강도(good/warning/critical)·리스크·팀원별 우선순위를 제안하며, 결과는 보관함에 저장되어 이력 관리가 가능하다.

#### 기능 6 — AI 작업물 보관함

킥오프·집계·회의록·팀 일지 등 모든 AI 생성물을 프로젝트 단위로 아카이브한다. 타입별 필터링, 내용 펼치기, 개별 삭제를 지원한다.

#### 기능 7 — 개인 메시지(DM) 및 친구 시스템

팀원 프로필에서 1:1 개인 메시지를 시작한다. 실시간 메시지 수신·미읽 뱃지·파일 및 이미지 첨부를 지원한다. 친구 요청·수락·거절 기능이 있으며, 여러 팀플에서 만난 상대는 단일 대화창에서 통합 관리된다.

#### 기능 8 — 알림 시스템

친구 요청·팀원 참가·파일 업로드·AI 작업 완료 등 모든 이벤트를 실시간 알림으로 수신한다. 미읽 뱃지와 읽음 처리를 지원한다.

#### 공통 — 공동 목표 대시보드

팀 전체가 실시간으로 공유하는 단일 화면. 목표·마일스톤 진행률·마감 D-day·역할 현황을 한눈에 확인한다. 모바일·데스크톱 모두 접속 가능한 반응형 웹이다.

---

### 3-2. 사용자 플로우

```
회원가입 / 로그인
        |
        v
팀플 생성 or 초대 코드로 참여
  - 초대 코드 6자리 자동 발급
  - 팀원 이름·스킬·AI 참고 메모 입력
        |
        v
AI 킥오프 설계자 (Gemini 호출)
  - 도메인 페르소나 자동 감지
  - 역할 분배안 + 주차별 마일스톤 생성
  - 보관함 자동 저장
        |
        v
공동 목표 대시보드 운영
  - 마일스톤 체크 + 할일 카드 진행률
  - 기획안·파일 업로드
        |
        v
매일 팀 일지 기록 (API 호출 없음)
  - 각 팀원이 기여 내용·달성률 입력
        |
        v
[선택] AI 내용 정리 → AI 일지 만들기
[선택] 팀 채팅 + AI 요약 / AI 회의록
[선택] AI 집계 에이전트
        |
        v
AI 보관함에서 전체 기록 조회
```

---

## 4. 기대 효과

| 개선 항목 | 도입 전 | 도입 후 |
|---|---|---|
| 팀 세팅 시간 | 역할 논의에 1~2시간 | AI 킥오프로 10분 이내 완결 |
| 무임승차 억제 | 측정 수단 없음 | 일지 기록·AI 집계로 기여도 투명 공유 |
| 전문성 반영 | 일반적 역할 분배 | 도메인 페르소나로 분야 특화 설계 |
| 기록 부담 | 회의록·일지 수동 작성 | AI가 채팅·기여를 자동 정리·보관 |
| 툴 진입 장벽 | 세팅에 30분 이상 | 정보 입력 후 3분 안에 프로젝트 시작 |

---

## 5. AI 활용 전략

### 5-1. 서비스 내 AI — Gemini 2.5 Flash

**선택 근거:**
- 무료 API(250 RPD)로 공모전 데모 수준의 완성도 달성 가능
- 1M 토큰 컨텍스트로 팀 전체 프로젝트 맥락을 단일 호출에 포함 가능
- JSON 출력 강제 및 낮은 temperature 설정으로 구조화된 결과 안정적 확보

**도메인 페르소나 시스템 (`src/lib/projectPersona.js`):**

프로젝트 주제·목표·제목을 정규식으로 분석하여 9개 도메인을 자동 감지한다.

| 도메인 | 감지 키워드 예시 | 페르소나 초점 |
|---|---|---|
| 게임 | game, unity, rpg, gdd | GDD 구조, 레벨 설계, core loop |
| 마케팅 | 마케팅, sns, 캠페인, brand | KPI, 채널 전략, 메시지 프레이밍 |
| 모바일 앱 | app, flutter, swift, android | UX Flow, 배포 프로세스 |
| 웹 | react, next, backend, api | 컴포넌트 설계, CI-CD |
| AI·데이터 | ai, ml, 머신러닝, dataset | 데이터 품질, 실험 관리 |
| 디자인 | figma, ui, ux, 브랜딩 | 디자인 시스템, 프로토타입 |
| 리서치 | 논문, 실험, 설문, 통계 | 연구 엄밀성, 데이터 타당성 |
| 스타트업 | mvp, 창업, 린스타트업, 고객검증 | 빌드-측정-학습 사이클 |
| 하드웨어 | 아두이노, iot, 임베디드, pcb | 하드웨어-소프트웨어 통합 |

감지된 도메인에 맞는 페르소나를 모든 AI 호출의 system prompt에 주입하며, 킥오프·마일스톤·일지·회의록·집계 에이전트 전체에 동일하게 적용된다.

### 5-2. 개발 단계 AI 도구

| 도구 | 용도 |
|---|---|
| Claude (Anthropic) | 전체 아키텍처 설계, 프롬프트 설계, 기획 문서 초안 |
| Claude Code | 코드 구현 전 과정 — 컴포넌트, API 라우트, DB 쿼리, 스타일링 |
| Cursor | 로컬 코드 탐색, 빠른 수정 및 디버깅 |

> 코드베이스의 대부분은 Claude Code와의 AI 바이브 코딩으로 작성되었다. 설계 의도를 자연어로 지시하면 AI가 코드로 번역하고, 개발자는 방향성·UX·데이터 구조를 결정하는 방식으로 짧은 시간에 완성도 높은 서비스를 구현했다. 전체 협업 과정은 `docs/ai-collaboration-log.md`에 기록되어 있다.

---

## 6. 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Server Components, API Routes) |
| 스타일링 | TailwindCSS 4 (CSS 변수, 커스텀 spring 애니메이션) |
| 데이터베이스 | Supabase (PostgreSQL, Row Level Security) |
| 인증 | Supabase Auth (이메일 회원가입/로그인) |
| 실시간 | Supabase Realtime (Postgres Changes 구독) |
| 파일 스토리지 | Supabase Storage (DM 파일 첨부, 기획안 업로드) |
| AI API | Gemini 2.5 Flash (Google AI Studio) |
| 배포 | Vercel |

---

## 7. 시스템 아키텍처

```
[클라이언트 — Next.js App Router]
  - React 컴포넌트 (use client)
  - Supabase JS 클라이언트 (Realtime 구독)
        |
        | fetch (same-origin)
        v
[Next.js API Routes — /api/...]
  - Gemini API 호출 (서버 측, 키 노출 없음)
  - Supabase Admin 쿼리
  - 도메인 페르소나 주입 (getProjectPersona)
        |
        |──→ [Supabase DB (PostgreSQL)]
        |       - projects, members, milestones, tasks
        |       - contribution_logs, messages, direct_messages
        |       - ai_artifacts, project_files, profiles
        |       - notifications, friend_requests
        |
        |──→ [Supabase Realtime]
        |       - 채팅, DM, 멤버 변경, 알림 실시간 반영
        |
        |──→ [Supabase Storage]
        |       - 기획안, 파일 자료실, DM 파일 첨부 (teamver 버킷)
        |
        └──→ [Gemini 2.5 Flash API]
                - 킥오프, 집계, 일지 정리/생성
                - 채팅 요약/회의록, 마일스톤 생성
```

> API 키는 Next.js 서버 환경변수에만 존재하며 클라이언트에 노출되지 않는다.

---

## 8. AI 에이전트 명세

### 공통 — 도메인 페르소나 시스템

모든 에이전트는 호출 전 `getProjectPersona(project)` 함수를 통해 프로젝트 주제에 맞는 페르소나 문자열을 생성하여 system prompt 첫 줄에 주입한다. temperature는 전 에이전트 공통 `0.2~0.35` (일관성 우선).

---

### 에이전트 1 — 킥오프 설계자 (`/api/kickoff`)

```
호출 시점 : 프로젝트 생성 후 언제든 실행 / 재실행 가능
출력 형식 : JSON (responseMimeType 강제)
프롬프트 : /prompts/kickoff-agent.txt
```

재실행 시 이전 킥오프·집계·일지 아티팩트를 `team_history`로 주입하여 팀 이력을 반영한 재설계가 이루어진다.

---

### 에이전트 2 — AI 다음 마일스톤 생성 (`/api/projects/[id]/milestones/next`)

```
호출 시점 : "AI로 다음 마일스톤 생성" 버튼 클릭
```

현재 마일스톤 완료율·할일 현황·기획안·최근 채팅을 분석해 다음 주차 마일스톤 1개를 생성하여 DB에 저장한다.

---

### 에이전트 3 — AI 내용 정리 (`/api/projects/[id]/journal/organize`)

```
호출 시점 : 팀 일지 패널 "내용 정리" 버튼 (관리자 전용)
출력 저장 : ai_artifacts (type: journal_draft)
```

당일 기준 최근 7일의 기여 로그를 날짜별로 그룹핑하여 도메인 특화 관점으로 구조화한 요약을 생성한다.

---

### 에이전트 4 — AI 일지 만들기 (`/api/projects/[id]/journal/create`)

```
호출 시점 : 팀 일지 패널 "일지 만들기" 버튼 (관리자 전용)
출력 저장 : ai_artifacts (type: journal)
```

누적된 journal_draft 전체와 킥오프 역할·마일스톤·최근 집계 건강도를 참조하여 공식 팀 일지를 작성하고 보관함에 저장한다.

---

### 에이전트 5 — 채팅 요약·회의록 (`/api/projects/[id]/messages/summarize`)

```
모드 "summary" : 채팅창 내 표시 (보관함 저장 안 함)
모드 "minutes" : ai_artifacts (type: minutes) 저장 + 팀원 알림
```

채팅 내용을 바탕으로 도메인 특화 형식의 회의록(논의 내용·결정 사항·액션 아이템)을 생성한다.

---

### 에이전트 6 — 집계 에이전트 (`/api/projects/[id]/aggregate`)

```
호출 시점 : 방장/관리자가 수동 실행
출력 저장 : ai_artifacts (type: aggregate)
```

최근 30일 기여 로그·마일스톤 진행률·역할·파일·채팅을 종합 분석한다.

**출력 스키마:**
```json
{
  "summary": "팀 현황 3~4문장",
  "overall_health": "good | warning | critical",
  "team_dynamic": "협업 평가 1~2문장",
  "member_analysis": [
    {
      "name": "string",
      "contribution_score": 75,
      "highlights": ["string"],
      "concerns": ["string"]
    }
  ],
  "risks": [{ "level": "high | medium | low", "description": "string" }],
  "priorities": [{ "rank": 1, "description": "string" }]
}
```

기여도 점수 산정 기준: task_completion 35% + avg_progress 25% + journal_entries 20% + file_uploads 10% + chat_activity 10%

---

## 9. 토큰 최적화 및 유지보수 전략

### 9-1. 토큰 최소화

- **JSON 출력 강제** — `responseMimeType: "application/json"` 설정으로 불필요한 자연어 설명 제거
- **선택적 호출 설계** — 모든 AI 기능은 사용자 명시적 액션(버튼 클릭)에만 호출. 자동 트리거 없음
- **경량 페르소나** — 도메인 페르소나는 1~2문장으로 제한
- **컨텍스트 압축** — 기여 로그를 집계 요약 형태로 전달, 원문 전체 전송 방지
- **모델 폴백** — Gemini 2.5 Flash → 2.0 Flash → 1.5 Flash 순으로 자동 폴백

### 9-2. 유지보수성

- **프롬프트 파일 분리** — 킥오프 system prompt를 `/prompts/kickoff-agent.txt`로 버전 관리
- **페르소나 중앙화** — `src/lib/projectPersona.js` 단일 파일에서 도메인 감지 로직 관리
- **알림 중앙화** — `src/lib/notify.js`에서 단건/프로젝트 전체 알림 함수 분리

### 9-3. 재현성

- **temperature 고정** — 구조화 출력이 중요한 에이전트는 0.2~0.35 고정
- **응답 검증** — JSON 파싱 실패 시 정규식으로 블록 추출 재시도 후 명시적 에러 반환

---

## 10. 프로젝트 구조

```
teamver/
├── docs/                        # 기획·설계 문서 (심사 자료)
│   ├── PLAN.md                  # 전체 기획서 (이 문서)
│   ├── WORKFLOW.md              # 개발 단계별 진행 이력
│   ├── ai-report.md             # 공모전 제출용 AI 활용 리포트
│   ├── ai-collaboration-log.md  # AI 협업 과정 전체 기록
│   └── prompt-design.md         # 프롬프트 설계 명세
├── prompts/
│   ├── kickoff-agent.txt        # 킥오프 에이전트 system prompt
│   └── weekly-review-agent.txt  # 주간 리뷰 에이전트 system prompt
├── supabase/
│   └── migration_01~26.sql      # DB 마이그레이션 이력 (번호 순 실행)
├── src/
│   ├── app/
│   │   ├── page.js              # 랜딩 / 로그인
│   │   ├── home/page.js         # 메인 로비
│   │   ├── projects/
│   │   │   ├── new/page.js      # 프로젝트 생성
│   │   │   └── [id]/page.js     # 프로젝트 대시보드
│   │   ├── join/[code]/page.js  # 초대 링크 참여
│   │   └── api/                 # API Routes
│   │       ├── kickoff/         # 킥오프 에이전트
│   │       ├── review/          # 주간 리뷰 에이전트
│   │       ├── contributions/   # 기여 로그 CRUD
│   │       ├── dm/              # 개인 메시지
│   │       ├── friends/         # 친구 요청 관리
│   │       ├── notifications/   # 알림 관리
│   │       ├── users/search/    # 유저 검색
│   │       └── projects/[id]/
│   │           ├── aggregate/        # 집계 에이전트
│   │           ├── milestones/next/  # 마일스톤 AI 생성
│   │           ├── messages/summarize/ # 채팅 요약·회의록
│   │           ├── journal/          # 일지 정리·생성
│   │           ├── contributions/    # 기여 조회
│   │           ├── artifacts/        # AI 보관함 CRUD
│   │           ├── files/            # 파일 업로드
│   │           └── tasks/            # 할일 관리
│   ├── components/
│   │   ├── ChatPanel.js         # 팀 채팅 (우측 패널)
│   │   ├── JournalPanel.js      # 팀 일지 (좌측 패널)
│   │   ├── MilestonesSection.js # 마일스톤 로드맵
│   │   ├── TasksSection.js      # 할일 카드
│   │   ├── AIArchive.js         # AI 보관함 모달
│   │   ├── AggregateReport.js   # 집계 결과 모달
│   │   ├── AiResultModal.js     # AI 결과 팝업
│   │   ├── DialogProvider.js    # 커스텀 다이얼로그 시스템
│   │   ├── PlanningDocs.js      # 기획안 관리
│   │   ├── FilesSection.js      # 파일 자료실
│   │   ├── RainBackground.js    # 로그인 배경 애니메이션
│   │   ├── Spinner.js           # 로딩 스피너
│   │   ├── ContributionForm.js  # 기여 입력 폼
│   │   ├── WeeklyReviewButton.js # 주간 리뷰 버튼
│   │   └── tabs/
│   │       ├── ProjectsTab.js       # 팀플 목록
│   │       ├── MessagesTab.js       # 개인 DM + 친구 관리
│   │       ├── NotificationsTab.js  # 알림
│   │       ├── MyInfoTab.js         # 내 정보
│   │       └── SettingsTab.js       # 설정
│   └── lib/
│       ├── supabase.js          # Supabase 클라이언트 (lazy proxy)
│       ├── auth.js              # 인증 헬퍼
│       ├── notify.js            # 알림 발송 유틸리티
│       └── projectPersona.js    # 도메인 페르소나 감지
├── .env.example
├── README.md
└── package.json
```

---

*이 문서는 Claude(Anthropic)와의 AI 협업을 통해 기획·설계되었으며,
코드베이스 또한 Claude Code를 활용한 AI 바이브 코딩으로 구현되었습니다.*

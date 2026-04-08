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
| 사용 AI 모델 | Gemini 2.5 Flash (Google AI Studio) |
| 개발 방식 | Claude Code · Cursor를 활용한 AI 바이브 코딩으로 기획부터 구현까지 전 과정 진행 |

---

## 2. 문제 정의

### 2-1. 대상 사용자

- 국내 대학교에서 학기 단위 팀 프로젝트를 반복적으로 수행하는 대학생 전반
- 학기마다 새로운 팀 구성이 반복되며 역할이 유동적인 환경의 학습자

### 2-2. 핵심 페인 포인트

| # | 페인 포인트 | 구체적 상황 |
|---|---|---|
| 1 | 역할 불명확 | 팀 구성 직후 누가 무엇을 맡을지 정하는 데 1~2시간 소요, 갈등 발생 |
| 2 | 무임승차 | 기여도 측정 수단이 없어 불공정한 결과가 학기마다 반복됨 |
| 3 | 툴 진입 장벽 | Notion, Jira 등 기존 협업 툴은 2~8주짜리 팀플 대비 세팅 비용이 지나치게 큼 |
| 4 | AI 활용 공백 | 팀플에 AI를 적극 활용하고 싶지만 어떻게 녹여야 할지 알 수 없음 |

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

### 3-1. 핵심 기능

#### [ 기능 1 ] AI 킥오프 설계자

- 팀원 이름, 스킬셋, 성향, 프로젝트 목표, 기간을 입력
- Gemini가 최적 역할 분배안 + 주차별 마일스톤을 자동 생성
- 프로젝트 주제(게임·마케팅·앱·AI 등)에 따라 **도메인 페르소나**를 자동 부여하여 해당 분야 전문성을 반영한 결과 생성
- 호출 시점 : 프로젝트 최초 생성 시, 이후 언제든 재실행 가능

#### [ 기능 2 ] 마일스톤 및 할일 관리

- AI 킥오프 결과로 생성된 주차별 마일스톤을 팀 전체가 공유
- 마일스톤 내 세부 태스크를 체크박스로 완료 처리, 진행률 자동 계산
- 어드민이 마일스톤 직접 편집·삭제 가능
- "AI로 다음 마일스톤 생성" — 현재 진행 상황과 기획안을 분석해 다음 단계 자동 제안
- 별도 할일 카드(Tasks)로 개별 작업 진행률 슬라이더 관리

#### [ 기능 3 ] 팀 일지 및 기여 기록

- 팀원이 매일 완료한 작업·메모·달성률을 자유롭게 입력 (좌측 패널)
- **AI 내용 정리** — 팀 전체의 당일 기여 내용을 도메인 특화 관점으로 구조화
- **AI 일지 만들기** — 정리 내용을 바탕으로 공식 팀 일지 생성, 보관함에 자동 저장
- 날짜별 기여 이력 조회 가능

#### [ 기능 4 ] 팀 채팅 및 회의록

- 팀 전체 실시간 채팅 (우측 패널, Supabase Realtime)
- **AI 요약** — 채팅 내용을 4~6문장으로 요약해 채팅창 내에 표시
- **AI 회의록** — 도메인 특화 형식으로 공식 회의록을 작성, 보관함에 저장

#### [ 기능 5 ] AI 집계 에이전트

- 팀 전체 기여 로그, 마일스톤 진행률, 역할 현황을 종합 분석
- 팀 건강도 진단, 리스크 감지, 팀원별 다음 주 우선순위 제안
- 결과는 보관함에 저장되어 이력 관리 가능

#### [ 기능 6 ] AI 작업물 보관함

- 킥오프, 집계, 회의록, 팀 일지 등 모든 AI 생성물을 프로젝트 단위로 아카이브
- 타입별 필터링, 내용 펼치기, 개별 삭제

#### [ 기능 7 ] 개인 메시지 (DM)

- 팀원 프로필에서 1:1 개인 메시지 시작
- 실시간 메시지 수신, 미읽 뱃지, 파일 및 이미지 첨부
- 여러 팀플에서 만난 상대는 하나의 대화창에서 통합 관리

#### [ 공통 ] 공동 목표 대시보드

- 팀 전체가 실시간으로 보는 단일 화면
- 목표, 마일스톤 진행률, 마감 D-day, 역할 현황 한눈에 확인
- 모바일·데스크톱 모두 접속 가능한 반응형 웹

---

### 3-2. 사용자 플로우

```
팀원 초대 및 정보 입력
        |
        v
AI 킥오프 설계자 (Gemini 호출 #1)
  - 도메인 페르소나 자동 감지
  - 역할 분배안 생성
  - 주차별 마일스톤 생성
        |
        v
공동 목표 대시보드 활성화
  - 마일스톤 진행 관리
  - 할일 카드 운영
        |
        v
매일 팀 일지 기록 (API 호출 없음)
  - 각 팀원이 기여 내용·달성률 입력
        |
        v
[선택] AI 내용 정리 / AI 일지 만들기 (Gemini 호출)
[선택] AI 회의록 (Gemini 호출)
[선택] AI 집계 에이전트 (Gemini 호출)
  - 진행 진단 + 리스크 감지 + 우선순위 재조정
        |
        v
AI 보관함에서 전체 기록 조회 및 관리
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

**도메인 페르소나 시스템:**
- 프로젝트 주제를 정규식으로 분석하여 9개 도메인 자동 감지 (게임, 마케팅, 모바일 앱, 웹, AI·데이터, 디자인, 리서치, 스타트업, 하드웨어)
- 감지된 도메인에 맞는 1~2문장 페르소나를 모든 AI 호출의 system prompt에 주입
- 킥오프, 마일스톤 생성, 일지 정리, 회의록, 집계 등 모든 에이전트에 동일하게 적용
- 토큰 낭비 없이 프롬프트 앞단에만 페르소나를 덧붙이는 경량 설계

### 5-2. 개발 단계 AI 도구

| 도구 | 용도 |
|---|---|
| Claude (Anthropic) | 전체 아키텍처 설계, DB 스키마, API 명세, 프롬프트 초안 작성 |
| Claude Code | 실제 코드 구현 — 컴포넌트, API 라우트, Supabase 쿼리, 스타일링 전반을 AI와 페어 프로그래밍으로 작성 |
| Cursor | 로컬 코드 탐색, 빠른 수정 및 디버깅 |

> 이 프로젝트의 코드베이스는 AI 바이브 코딩을 통해 기획부터 구현까지
> 대부분의 로직을 AI와 협력하여 작성하였다.
> 설계 의도를 자연어로 지시하면 AI가 코드로 번역하고,
> 개발자는 방향성과 품질을 검토하는 방식으로 짧은 시간에 완성도 높은 서비스를 구현했다.

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
| 버전 관리 | GitHub |

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
        |       - ai_artifacts, planning_docs, files, profiles
        |
        |──→ [Supabase Realtime]
        |       - 채팅, DM, 멤버 변경 실시간 반영
        |
        |──→ [Supabase Storage]
        |       - DM 파일 첨부 (teamver 버킷)
        |
        └──→ [Gemini 2.5 Flash API]
                - 킥오프, 집계, 일지 정리/생성
                - 채팅 요약/회의록, 마일스톤 생성
```

> API 키는 Next.js 서버 환경변수에만 존재하며 클라이언트에 절대 노출되지 않는다.

---

## 8. AI 에이전트 명세

### 공통 — 도메인 페르소나 시스템

모든 에이전트는 호출 전 `getProjectPersona(project)` 함수를 통해 프로젝트 주제에 맞는 페르소나 문자열을 생성하여 system prompt 첫 줄에 주입한다.

```
예시 — 게임 프로젝트:
"당신은 게임 개발 프로젝트 전문 PM입니다. 게임 디자인, 레벨 설계,
유저 경험, 개발 파이프라인에 정통한 관점으로 분석하세요."
```

temperature는 전 에이전트 공통 `0.3` 고정 (일관성 우선).

---

### 에이전트 1 — 킥오프 설계자

```
호출 시점 : 프로젝트 생성 시 + 재실행 가능
출력 형식 : JSON (responseMimeType 강제)
```

**입력 스키마**
```json
{
  "domain_persona": "string",
  "project": { "title": "string", "goal": "string", "duration_weeks": "number", "subject": "string" },
  "members": [{ "name": "string", "skills": ["string"], "personality": "string" }],
  "planning_docs": ["string"]
}
```

**출력 스키마**
```json
{
  "role_assignments": [{ "member_name": "string", "role": "string", "responsibilities": ["string"] }],
  "milestones": [{ "week": "number", "title": "string", "tasks": ["string"] }]
}
```

---

### 에이전트 2 — 마일스톤 다음 단계 생성

```
호출 시점 : "AI로 다음 마일스톤 생성" 버튼 클릭 시
```

현재 마일스톤 완료율, 할일 현황, 기획안을 분석해 다음 주차 마일스톤 1개를 생성하여 DB에 저장.

---

### 에이전트 3 — AI 내용 정리 (journal/organize)

```
호출 시점 : 팀 일지 패널 "내용 정리" 버튼
출력 저장 : ai_artifacts (type: journal_draft)
```

당일 팀원 전체의 contribution_logs를 읽어 도메인 특화 관점으로 구조화된 요약 생성. 여러 번 호출 가능하며 결과가 누적된다.

---

### 에이전트 4 — AI 일지 만들기 (journal/create)

```
호출 시점 : 팀 일지 패널 "일지 만들기" 버튼
출력 저장 : ai_artifacts (type: journal)
```

누적된 journal_draft 전체를 참고하여 공식 팀 일지를 작성, 보관함에 저장.

---

### 에이전트 5 — 채팅 회의록 (messages/summarize)

```
호출 시점 : 채팅 패널 "회의록" 버튼 (관리자 전용)
출력 저장 : ai_artifacts (type: minutes) + 채팅창 내 표시
AI 요약    : 채팅창 내 표시만, 보관함 저장 없음
```

채팅 내용을 바탕으로 도메인 특화 형식의 회의록(논의 내용·결정 사항·액션 아이템) 생성.

---

### 에이전트 6 — 집계 에이전트 (aggregate)

```
호출 시점 : 프로젝트 메인 "집계" 버튼 (관리자 전용)
출력 저장 : ai_artifacts (type: aggregate)
```

**입력:** 팀원 기여 로그, 마일스톤 진행률, 역할 현황, 프로젝트 메타
**출력:** 팀 건강도(good/warning/critical), 리스크 목록(level/description), 팀원별 우선순위

---

## 9. 토큰 최적화 및 유지보수 전략

### 9-1. 토큰 최소화

- **JSON 출력 강제** — `responseMimeType: "application/json"` 설정으로 불필요한 자연어 설명 제거
- **선택적 호출 설계** — 킥오프(1회), 일지(선택), 회의록(선택), 집계(선택)으로 자동 호출 없음
- **경량 페르소나** — 도메인 페르소나는 1~2문장 이내로 제한, 과도한 토큰 소모 방지
- **컨텍스트 압축** — 기여 로그를 집계 요약 형태로 전달, 원문 전체 전송 방지

### 9-2. 유지보수성

- **프롬프트 파일 분리** — 킥오프 system prompt를 `/prompts/kickoff-agent.txt`로 버전 관리
- **페르소나 중앙화** — `src/lib/projectPersona.js` 단일 파일에서 도메인 감지 로직 관리
- **모델 교체 용이성** — Gemini 호출부를 각 API 라우트 상단에 `callGemini()` 함수로 추상화
- **AI 협업 기록** — 설계 과정을 `/docs`에 문서화하여 재현성 확보

### 9-3. 재현성

- **temperature 0.3 고정** — 역할 분배·마일스톤·일지 생성 모두 일관성 우선
- **응답 검증** — JSON 파싱 실패 시 에러 반환, fallback 없이 명시적 실패 처리

---

## 10. 프로젝트 구조

```
teamver/
├── docs/
│   ├── PLAN.md                  # 전체 기획서
│   ├── WORKFLOW.md              # 개발 워크플로우
│   ├── ai-report.md             # 공모전 제출용 AI 리포트
│   └── prompt-design.md         # 프롬프트 설계 문서
├── prompts/
│   └── kickoff-agent.txt        # 킥오프 에이전트 system prompt
├── supabase/
│   └── migration_01~14.sql      # DB 마이그레이션 이력
├── src/
│   ├── app/
│   │   ├── page.js              # 랜딩 / 로그인
│   │   ├── home/page.js         # 메인 로비 (팀플 목록, DM, 설정)
│   │   ├── projects/
│   │   │   ├── new/page.js      # 프로젝트 생성
│   │   │   └── [id]/page.js     # 프로젝트 대시보드
│   │   ├── join/[code]/page.js  # 초대 링크 참여
│   │   └── api/                 # Next.js API Routes
│   │       ├── kickoff/         # 킥오프 에이전트
│   │       ├── contributions/   # 기여 로그 저장
│   │       ├── dm/              # 개인 메시지
│   │       └── projects/[id]/
│   │           ├── aggregate/   # 집계 에이전트
│   │           ├── milestones/next/  # 마일스톤 AI 생성
│   │           ├── messages/summarize/  # 채팅 요약·회의록
│   │           ├── journal/     # 일지 정리·생성
│   │           ├── contributions/  # 기여 조회
│   │           └── artifacts/   # AI 보관함 CRUD
│   ├── components/
│   │   ├── ChatPanel.js         # 팀 채팅 (우측 패널)
│   │   ├── JournalPanel.js      # 팀 일지 (좌측 패널)
│   │   ├── MilestonesSection.js # 마일스톤 로드맵
│   │   ├── TasksSection.js      # 할일 카드
│   │   ├── AIArchive.js         # AI 보관함 모달
│   │   ├── AggregateReport.js   # 집계 결과 모달
│   │   ├── DialogProvider.js    # 커스텀 다이얼로그 시스템
│   │   ├── PlanningDocs.js      # 기획안 관리
│   │   ├── FilesSection.js      # 파일 자료실
│   │   └── tabs/
│   │       ├── ProjectsTab.js   # 팀플 목록
│   │       ├── MessagesTab.js   # 개인 DM
│   │       ├── MyInfoTab.js     # 내 정보
│   │       ├── SettingsTab.js   # 설정
│   │       └── NotificationsTab.js  # 알림 (준비 중)
│   └── lib/
│       ├── supabase.js          # Supabase 클라이언트
│       ├── auth.js              # 인증 헬퍼
│       └── projectPersona.js    # 도메인 페르소나 감지
├── .env.example
└── README.md
```

---

*이 문서는 Claude(Anthropic)와의 AI 협업을 통해 기획·설계되었으며,
코드베이스 또한 Claude Code를 활용한 AI 바이브 코딩으로 구현되었습니다.*

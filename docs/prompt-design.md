# prompt-design.md
# Teamver — 프롬프트 설계 문서

---

## 목차

1. [설계 원칙](#1-설계-원칙)
2. [도메인 페르소나 시스템](#2-도메인-페르소나-시스템)
3. [에이전트 1 — 킥오프 설계자](#3-에이전트-1--킥오프-설계자)
4. [에이전트 2 — 다음 마일스톤 생성](#4-에이전트-2--다음-마일스톤-생성)
5. [에이전트 3 — AI 내용 정리](#5-에이전트-3--ai-내용-정리)
6. [에이전트 4 — AI 일지 만들기](#6-에이전트-4--ai-일지-만들기)
7. [에이전트 5 — 채팅 요약·회의록](#7-에이전트-5--채팅-요약회의록)
8. [에이전트 6 — 집계 에이전트](#8-에이전트-6--집계-에이전트)
9. [에이전트 7 — 주간 리뷰어 (보조)](#9-에이전트-7--주간-리뷰어-보조)
10. [공통 제약 및 가이드라인](#10-공통-제약-및-가이드라인)
11. [프롬프트 버전 관리 규칙](#11-프롬프트-버전-관리-규칙)

---

## 1. 설계 원칙

| 원칙 | 설명 |
|---|---|
| JSON 출력 강제 | 모든 에이전트는 자연어가 아닌 JSON으로만 응답. 불필요한 설명 텍스트 제거 |
| 페르소나 고정 | 에이전트마다 명확한 역할과 도메인 전문성을 부여하여 일관된 출력 품질 유지 |
| 최소 입력 설계 | 사용자가 입력해야 할 항목을 최소화하고, 필요한 맥락은 DB에서 자동 수집 |
| 재현성 확보 | temperature 0.2~0.35 고정 + 스키마 명시로 동일 입력 시 유사 출력 보장 |
| 사실 기반 출력 | 기록에 없는 내용을 추론하거나 임의로 채우지 않도록 system prompt에 명시 |
| 모델 폴백 | Gemini 2.5 Flash → 2.0 Flash → 1.5 Flash 순으로 자동 폴백 (429/503 재시도) |

---

## 2. 도메인 페르소나 시스템

**파일:** `src/lib/projectPersona.js`

모든 에이전트 호출 전 실행되는 공통 레이어. 프로젝트 `subject`, `goal`, `title`을 합친 문자열을 정규식으로 분석하여 9개 도메인 중 하나를 감지하고, 해당 도메인의 전문 PM 페르소나를 반환한다.

### 감지 도메인 및 페르소나 초점

| 도메인 | 정규식 키워드 (예시) | 페르소나 분석 기준 |
|---|---|---|
| 게임 | game, unity, rpg, gdd, 픽셀, 던전 | GDD 구조, 레벨·밸런스 설계, core loop |
| 마케팅 | 마케팅, sns, 광고, 캠페인, brand | 타깃 오디언스, KPI, 채널 전략 |
| 모바일 앱 | app, flutter, swift, kotlin, android | UX Flow, 스토어 배포 프로세스 |
| 웹 | react, next, vue, backend, api, db | 컴포넌트 설계, API 계약, CI-CD |
| AI·데이터 | ai, ml, 머신러닝, nlp, 데이터, dataset | 데이터 품질, 모델 성능, 재현 가능성 |
| 디자인 | figma, ui, ux, 브랜딩, 모션 | 디자인 시스템, 프로토타입, 사용성 테스트 |
| 리서치 | 논문, 실험, 설문, 통계, 가설 | 연구 엄밀성, 분석 타당성 |
| 스타트업 | mvp, 창업, 린스타트업, bm, 고객검증 | 빌드-측정-학습, 피봇 판단 |
| 하드웨어 | 아두이노, iot, 임베디드, pcb, 펌웨어 | 하드웨어 의존성, 부품 리스크 |

감지 실패 시 `subject`를 직접 주입한 범용 페르소나를 사용한다.

### 활용 방식

```javascript
const persona = getProjectPersona(project);
// 각 에이전트 system prompt 또는 userPrompt에 domain_persona 필드로 주입
```

---

## 3. 에이전트 1 — 킥오프 설계자

### 개요

| 항목 | 내용 |
|---|---|
| 파일 위치 | `/prompts/kickoff-agent.txt` |
| API 라우트 | `POST /api/kickoff` |
| 호출 시점 | 프로젝트 생성 후 또는 재실행 시 |
| 모델 | Gemini 2.5 Flash |
| temperature | 0.3 |

### 특징

- 팀 이력 반영: 이전 킥오프·집계·일지를 `team_history` 필드로 주입하여 재실행 시 팀 성과 기반 개선 설계
- 기획안 반영: `planning_documents` 필드에 업로드된 기획안 제목·설명을 포함
- 마일스톤 품질 가이드라인: 주차별 역할(초반 세팅·중반 개발·후반 통합)을 프롬프트에 명시하여 일관된 구조 확보

### 입력 스키마

```json
{
  "domain_persona": "string",
  "project": {
    "title": "string",
    "goal": "string",
    "duration_weeks": "number",
    "subject": "string",
    "planning_documents": "string",
    "team_history": "string"
  },
  "members": [
    { "name": "string", "skills": ["string"], "personality": "string" }
  ],
  "ai_members": []
}
```

### 출력 스키마

```json
{
  "role_assignments": [
    {
      "member_name": "string",
      "role": "string",
      "responsibilities": ["string"]
    }
  ],
  "milestones": [
    {
      "week": "number",
      "title": "string",
      "tasks": ["string"]
    }
  ],
  "ai_member_config": []
}
```

### Fallback 처리

```
1. JSON 파싱 실패 시 응답 텍스트에서 { ... } 블록 추출 재시도
2. 실패 시 균등 분배 기본 템플릿 반환
3. 에러 로그 기록
```

---

## 4. 에이전트 2 — 다음 마일스톤 생성

### 개요

| 항목 | 내용 |
|---|---|
| API 라우트 | `POST /api/projects/[id]/milestones/next` |
| 호출 시점 | "AI로 다음 마일스톤 생성" 버튼 클릭 |
| temperature | 0.35 |

### 입력 데이터

- 프로젝트 메타 (title, goal, subject, 기간)
- 기존 마일스톤 전체 (완료 태스크 수 포함)
- 할일 요약 (완료/진행중/미시작 수, 제목 목록)
- 최근 채팅 15건
- 기획안 파일 목록

---

## 5. 에이전트 3 — AI 내용 정리

### 개요

| 항목 | 내용 |
|---|---|
| API 라우트 | `POST /api/projects/[id]/journal/organize` |
| 호출 시점 | 팀 일지 패널 "내용 정리" 버튼 (관리자 전용) |
| 출력 저장 | `ai_artifacts` (type: `journal_draft`) |
| temperature | 0.2 |

### 출력 형식 (마크다운)

```markdown
## 기간 요약 (날짜 범위)
## 팀원별 기여 요약
## 주요 성과
## 이슈 / 다음 할 일
```

### 주요 제약

system prompt에 "기록에 없는 내용은 절대 추론하거나 채우지 마세요"를 명시하여 사실 기반 출력을 강제한다.

---

## 6. 에이전트 4 — AI 일지 만들기

### 개요

| 항목 | 내용 |
|---|---|
| API 라우트 | `POST /api/projects/[id]/journal/create` |
| 호출 시점 | "일지 만들기" 버튼 (관리자 전용, journal_draft 필수) |
| 출력 저장 | `ai_artifacts` (type: `journal`) |
| temperature | 0.2 |

### 입력 데이터

- 누적된 `journal_draft` 전체 텍스트
- 킥오프 역할 배정 컨텍스트
- 마일스톤 목록
- 최근 집계 건강도

### 출력 형식 (마크다운)

```markdown
# 팀 일지 — 날짜

## 오늘의 달성 요약
## 팀원 기여 현황 (표 형식)
## 완료된 주요 작업
## 이슈 및 리스크
## 다음 단계 제안
```

---

## 7. 에이전트 5 — 채팅 요약·회의록

### 개요

| 항목 | 내용 |
|---|---|
| API 라우트 | `POST /api/projects/[id]/messages/summarize` |
| 모드 | `summary` (채팅 내 표시) / `minutes` (보관함 저장) |
| 호출 시점 | 채팅 패널 버튼 클릭 (관리자 전용) |
| temperature | 0.2 |

### 회의록 출력 형식

```markdown
## 회의 일시
## 참석자
## 논의 내용
## 결정 사항
## 다음 할 일 (Action Items)
```

### 주요 제약

"채팅에 명확히 언급된 내용만 작성하세요. 대화에 없는 내용을 추론하지 마세요." 명시.

---

## 8. 에이전트 6 — 집계 에이전트

### 개요

| 항목 | 내용 |
|---|---|
| API 라우트 | `POST /api/projects/[id]/aggregate` |
| 호출 시점 | 방장/관리자 수동 실행 |
| 출력 저장 | `ai_artifacts` (type: `aggregate`) |
| temperature | 0.2 |

### 기여도 점수 산정 기준

| 항목 | 가중치 |
|---|---|
| task_completion (할일 완료율) | 35% |
| avg_progress (평균 진행도) | 25% |
| journal_entries (기여 기록 수) | 20% |
| file_uploads (파일 업로드 수) | 10% |
| chat_activity (채팅 참여 수) | 10% |

### 입력 데이터

최근 30일 기여 로그, 전체 할일 목록, 파일 목록, 최근 채팅 50건, 마일스톤 목록.

### System Prompt 핵심

```
Only reference facts from the provided data. Do not infer or fabricate information.
overall_health must be exactly one of: "good", "warning", "critical"
risk level must be exactly one of: "high", "medium", "low"
```

---

## 9. 에이전트 7 — 주간 리뷰어 (보조)

### 개요

| 항목 | 내용 |
|---|---|
| 파일 위치 | `/prompts/weekly-review-agent.txt` |
| API 라우트 | `POST /api/review` |
| 호출 시점 | 주간 리뷰 버튼 클릭 (선택적) |
| temperature | 0.3 |

집계 에이전트보다 경량화된 주간 단위 진단. `daily_achievement_rate` 0.5 미만 시 자동으로 risks에 플래그.

### 출력 스키마

```json
{
  "diagnosis": "string (2-3문장)",
  "risks": ["string"],
  "next_week_priorities": [
    { "member_name": "string", "focus_tasks": ["string"] }
  ]
}
```

---

## 10. 공통 제약 및 가이드라인

### API 호출 제한 전략

```
모든 에이전트  : 사용자 명시적 액션(버튼 클릭)에만 호출
자동 호출 금지 : 페이지 로드, 실시간 감지 등 자동 트리거 일절 미사용
킥오프         : 재실행 시 confirm 다이얼로그로 의도 확인
```

### 컨텍스트 최적화

```
킥오프 입력 토큰 예상치   : ~800 tokens (팀원 5명 + 이력 포함)
집계 입력 토큰 예상치     : ~1500 tokens (30일 기여 로그)
일지 정리 입력 토큰 예상치 : ~1000 tokens (7일 기여 기록)
절감 방법               : 기여 로그는 집계 요약본만 전달, 채팅은 최근 50~200건 제한
```

### 보안

- API 키는 서버 환경변수에만 존재 (`process.env.GEMINI_API_KEY`)
- 클라이언트 코드에 키 하드코딩 절대 금지
- `.env` 파일은 `.gitignore`에 포함

---

## 11. 프롬프트 버전 관리 규칙

```
파일명 형식 : kickoff-agent-v{N}.txt
변경 시     : 기존 파일 유지 + 새 버전 파일 추가
현재 사용 버전 : 이 문서 상단 "파일 위치" 항목에 명시
```

| 버전 | 변경 내용 | 날짜 |
|---|---|---|
| v1 | 킥오프 에이전트 최초 작성 | 2026-04-06 |
| v2 | 도메인 페르소나 주입, 마일스톤 품질 가이드라인 추가 | 2026-04-07 |
| v3 | team_history(재실행 이력 반영), planning_documents 필드 추가 | 2026-04-08 |

---

*이 문서는 Claude(Anthropic)와의 AI 협업을 통해 설계·작성되었습니다.*

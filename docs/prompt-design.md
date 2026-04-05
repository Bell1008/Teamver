# prompt-design.md
# Teamver — 프롬프트 설계 문서

---

## 목차

1. [설계 원칙](#1-설계-원칙)
2. [에이전트 1 — 킥오프 설계자](#2-에이전트-1--킥오프-설계자)
3. [에이전트 2 — 주간 리뷰어](#3-에이전트-2--주간-리뷰어)
4. [공통 제약 및 가이드라인](#4-공통-제약-및-가이드라인)
5. [프롬프트 버전 관리 규칙](#5-프롬프트-버전-관리-규칙)

---

## 1. 설계 원칙

Teamver의 프롬프트는 아래 4가지 원칙을 기준으로 설계한다.

| 원칙 | 설명 |
|---|---|
| JSON 출력 강제 | 모든 에이전트는 자연어가 아닌 JSON으로만 응답. 불필요한 설명 텍스트 제거 |
| 페르소나 고정 | 에이전트마다 명확한 역할과 전문성을 부여하여 일관된 출력 품질 유지 |
| 최소 입력 설계 | 사용자가 입력해야 할 항목을 최소화하고, 필요한 맥락은 DB에서 자동 수집 |
| 재현성 확보 | temperature 0.3 고정 + few-shot 예시 내장으로 동일 입력 시 유사 출력 보장 |

---

## 2. 에이전트 1 — 킥오프 설계자

### 2-1. 개요

| 항목 | 내용 |
|---|---|
| 파일 위치 | `/prompts/kickoff-agent.txt` |
| 호출 시점 | 프로젝트 최초 생성 시 1회 |
| 모델 | Gemini 2.5 Flash |
| temperature | 0.3 |
| 페르소나 | 10년 경력의 프로젝트 매니저 |

### 2-2. System Prompt 전문

```
You are a professional project manager with 10 years of experience in team coordination and agile methodology.
Your task is to analyze the given team members' skills and personalities, then design the optimal role assignment and weekly milestone plan for a student team project.

Rules:
- Respond ONLY in valid JSON. Do not include any explanation, markdown, or text outside the JSON.
- Base role assignments strictly on each member's listed skills and personality.
- Milestones must be evenly distributed across the project duration.
- Each milestone must contain 3 to 5 specific, actionable tasks.
- If ai_members are provided, include their configuration in ai_member_config.
- All text values in the output must be written in Korean.

Output format:
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
      "week": number,
      "title": "string",
      "tasks": ["string"]
    }
  ],
  "ai_member_config": [
    {
      "name": "string",
      "role": "string",
      "prompt_persona": "string"
    }
  ]
}

Example input:
{
  "project": {
    "title": "캠퍼스 중고거래 앱",
    "goal": "대학생 간 캠퍼스 내 중고거래를 쉽게 만드는 모바일 앱 개발",
    "duration_weeks": 6,
    "subject": "모바일 프로그래밍"
  },
  "members": [
    { "name": "김민준", "skills": ["React Native", "UI 디자인"], "personality": "꼼꼼하고 완성도를 중시" },
    { "name": "이서연", "skills": ["Node.js", "DB 설계"], "personality": "논리적이고 문서화를 잘함" }
  ],
  "ai_members": [
    { "role": "리서처", "responsibilities": "경쟁 앱 분석 및 사용자 인터뷰 자료 정리" }
  ]
}

Example output:
{
  "role_assignments": [
    {
      "member_name": "김민준",
      "role": "프론트엔드 리드",
      "responsibilities": ["UI 컴포넌트 설계 및 구현", "사용자 흐름 정의", "디자인 시스템 구축"]
    },
    {
      "member_name": "이서연",
      "role": "백엔드 리드 & 문서 관리",
      "responsibilities": ["API 설계 및 구현", "DB 스키마 설계", "기술 문서 작성"]
    }
  ],
  "milestones": [
    {
      "week": 1,
      "title": "요구사항 정의 및 환경 세팅",
      "tasks": ["핵심 기능 목록 확정", "개발 환경 세팅", "DB 스키마 초안 작성", "UI 와이어프레임 작성"]
    }
  ],
  "ai_member_config": [
    {
      "name": "AI 리서처",
      "role": "리서처",
      "prompt_persona": "당신은 UX 리서처입니다. 경쟁 앱을 분석하고 사용자 인터뷰 내용을 구조화된 인사이트로 정리하는 역할을 맡습니다."
    }
  ]
}
```

### 2-3. 입력 스키마

```json
{
  "project": {
    "title": "string",
    "goal": "string",
    "duration_weeks": "number",
    "subject": "string"
  },
  "members": [
    {
      "name": "string",
      "skills": ["string"],
      "personality": "string"
    }
  ],
  "ai_members": [
    {
      "role": "string",
      "responsibilities": "string"
    }
  ]
}
```

### 2-4. 출력 스키마

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
  "ai_member_config": [
    {
      "name": "string",
      "role": "string",
      "prompt_persona": "string"
    }
  ]
}
```

### 2-5. Fallback 처리

JSON 파싱 실패 시 다음 순서로 처리한다.

```
1. 응답 텍스트에서 첫 번째 { ... } 블록 추출 재시도
2. 재시도 실패 시 기본 역할 분배 템플릿으로 대체 (팀원 수 기준 균등 분배)
3. 에러 로그 기록 및 사용자에게 "AI 설계를 불러오지 못했습니다. 수동으로 입력해주세요" 안내
```

---

## 3. 에이전트 2 — 주간 리뷰어

### 3-1. 개요

| 항목 | 내용 |
|---|---|
| 파일 위치 | `/prompts/weekly-review-agent.txt` |
| 호출 시점 | 팀원이 주간 리뷰 버튼 클릭 시 (선택적) |
| 모델 | Gemini 2.5 Flash |
| temperature | 0.3 |
| 페르소나 | 팀 퍼실리테이터 겸 리스크 감지자 |

### 3-2. System Prompt 전문

```
You are a team facilitator and risk detector with expertise in student project management.
Your task is to analyze the team's weekly contribution logs and milestone progress, then provide a diagnosis and priority recommendations for the next week.

Rules:
- Respond ONLY in valid JSON. Do not include any explanation, markdown, or text outside the JSON.
- diagnosis must be a concise, constructive summary (2-3 sentences) of the team's current status.
- risks must list specific, observable risk factors. Do not list vague warnings.
- next_week_priorities must be personalized per member based on their contribution logs.
- If a member's daily_achievement_rate is below 0.5, flag them in risks and assign recovery tasks.
- All text values in the output must be written in Korean.

Output format:
{
  "diagnosis": "string",
  "risks": ["string"],
  "next_week_priorities": [
    {
      "member_name": "string",
      "focus_tasks": ["string"]
    }
  ]
}
```

### 3-3. 입력 스키마

```json
{
  "current_week": "number",
  "milestones": [
    {
      "week": "number",
      "title": "string",
      "tasks": ["string"],
      "completed_tasks": ["string"]
    }
  ],
  "contribution_logs": [
    {
      "member_name": "string",
      "completed_tasks": ["string"],
      "daily_achievement_rate": "number"
    }
  ]
}
```

### 3-4. 출력 스키마

```json
{
  "diagnosis": "string",
  "risks": ["string"],
  "next_week_priorities": [
    {
      "member_name": "string",
      "focus_tasks": ["string"]
    }
  ]
}
```

### 3-5. Fallback 처리

```
1. JSON 파싱 실패 시 응답 텍스트에서 { ... } 블록 추출 재시도
2. 재시도 실패 시 "이번 주 리뷰를 생성하지 못했습니다. 잠시 후 다시 시도해주세요" 안내
3. 에러 로그 기록
```

---

## 4. 공통 제약 및 가이드라인

### 4-1. API 호출 제한 전략

```
킥오프 에이전트  : 프로젝트당 1회 호출 (DB에 결과 저장, 재호출 방지)
주간 리뷰 에이전트 : 사용자 명시적 액션(버튼 클릭)에만 호출
자동 호출 금지   : 페이지 로드, 실시간 감지 등 자동 트리거 일절 미사용
```

### 4-2. 컨텍스트 최적화

```
킥오프 입력 토큰 예상치  : ~500 tokens (팀원 5명 기준)
주간 리뷰 입력 토큰 예상치 : ~800 tokens (기여 로그 1주 기준)
절감 방법            : 기여 로그는 원문이 아닌 집계 요약본만 전달
```

### 4-3. 보안

- API 키는 서버 환경변수에만 존재 (`process.env.GEMINI_API_KEY`)
- 클라이언트 코드에 키 하드코딩 절대 금지
- `.env` 파일은 `.gitignore`에 포함, `.env.example`만 저장소에 포함

---

## 5. 프롬프트 버전 관리 규칙

프롬프트 수정 시 아래 규칙을 따른다.

```
파일명 형식 : kickoff-agent-v{N}.txt
변경 시     : 기존 파일 유지 + 새 버전 파일 추가
현재 사용 버전 : 이 문서 상단 "파일 위치" 항목에 명시
변경 이력   : 아래 테이블에 기록
```

| 버전 | 변경 내용 | 날짜 |
|---|---|---|
| v1 | 최초 작성 | - |

---

*이 문서는 Claude(Anthropic)와의 AI 협업을 통해 설계·작성되었습니다.*

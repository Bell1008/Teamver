# ai-collaboration-log.md
# Teamver — AI 협업 과정 기록

> 이 문서는 Teamver 기획·개발 전 과정에서 AI(Claude, Cursor)와 협업한 흐름을 기록한다.
> 공모전 심사 기준인 "AI와 효율적으로 협업하는 능력"의 근거 자료로 활용된다.

---

## 목차

1. [협업 구조 개요](#1-협업-구조-개요)
2. [기획 단계 협업 로그](#2-기획-단계-협업-로그)
3. [프롬프트 설계 협업 로그](#3-프롬프트-설계-협업-로그)
4. [개발 단계 협업 로그](#4-개발-단계-협업-로그)
5. [AI 협업에서 얻은 인사이트](#5-ai-협업에서-얻은-인사이트)

---

## 1. 협업 구조 개요

Teamver 프로젝트는 아래 3개 AI를 역할별로 분리하여 활용했다.

| AI | 역할 | 활용 단계 |
|---|---|---|
| Claude (claude.ai) | 기획 검증, 시장 조사, 문서 초안, 프롬프트 설계 | 기획 전 과정 |
| Cursor (Claude 기반) | 코드 생성, 리팩토링, 디버깅 | 개발 전 과정 |
| Gemini 2.5 Flash | 서비스 내 AI 기능 (킥오프 설계, 주간 리뷰) | 런타임 |

---

## 2. 기획 단계 협업 로그

### 2-1. 아이디어 탐색 — Claude와의 주요 의사결정 흐름

아래는 Claude와 기획을 진행하며 거친 핵심 의사결정 포인트를 정리한 것이다.

---

**[결정 1] 타겟 도메인 선정**

- 초기 후보 : K-12 / 대학교 / 직무교육 / 어학원
- 결정 : 대학생
- 근거 : 개발자 본인이 23세 대학생으로 실사용자 관점에서 가장 구체적인 페인 포인트를 알고 있음

---

**[결정 2] 페인 포인트 선정**

- Claude와 함께 대학 교육 현장의 페인 포인트 5개를 도출
- 후보 : 강의 복습 비효율 / 과제 피드백 부재 / 학습 막힘 감지 / 팀플 역할 갈등 / 공지 파편화
- 결정 : 팀플 역할 갈등 + 무임승차
- 근거 : 팀플 빈도 증가 추세 + AI가 확실히 강점을 발휘할 수 있는 텍스트·구조 기반 문제

---

**[결정 3] 시장 차별화 검증**

- Claude를 통해 기존 AI 협업 툴(Asana, ClickUp, Monday.com) 시장 조사
- 결론 : 기존 툴은 전부 기업 대상. 학생 팀플 전용 AI 도구는 국내외 미존재(해외 일부 도구는 존재하나 한국 대학생 맥락에 특화되지 않음)
- 결정 : 학생 팀플 전용이라는 버티컬 포지셔닝 확정

---

**[결정 4] AI 비용 제약 해결**

- 제약 : 무료 API만 사용해야 함
- Claude와 함께 Gemini 2.5 Flash 무료 티어(250 RPD) 분석
- 결론 : 선택적 호출 설계(킥오프 1회 + 주간 리뷰 선택)로 무료 범위 내 완성 가능
- 추가 인사이트 : 고비용 모델 없이 정교한 프롬프트로 동등 결과를 내는 것 자체가 "AI 효율적 활용"의 증거로 활용 가능

---

**[결정 5] 핵심 기능 확정**

- 후보 : 퀴즈 생성 / 포트폴리오 피드백 / 팀플 설계 / 학습 공백 진단
- 퀴즈 생성은 500팀 공모전에서 가장 흔한 패턴으로 제외
- 포트폴리오 피드백은 시각 작업물 AI 평가의 신뢰도 문제로 제외
- 결정 : 팀플 설계 (AI 킥오프 + 기여도 추적 + 주간 리뷰)

---

### 2-2. 기획 문서 작성 협업

| 문서 | Claude 역할 | 최종 작업자 |
|---|---|---|
| PLAN.md | 전체 구조 설계 및 초안 작성 | Claude → 검토·확정 |
| ai-report.md | 공모전 양식 기준 내용 작성 | Claude → 검토·확정 |
| prompt-design.md | 프롬프트 설계 및 스키마 정의 | Claude → 검토·확정 |
| ai-collaboration-log.md | 협업 흐름 구조화 | Claude → 검토·확정 |

---

## 3. 프롬프트 설계 협업 로그

### 3-1. 킥오프 에이전트 프롬프트 설계 과정

**초기 요구사항 (개발자 → Claude)**

```
팀원 정보를 넣으면 역할 분배와 마일스톤을 만들어주는 AI가 필요해.
출력은 JSON이어야 하고, 한국어로 나와야 해.
```

**Claude의 설계 제안 포인트**

- JSON 출력 강제를 위한 명시적 스키마 포함 필요
- few-shot 예시를 system prompt에 내장하여 재현성 확보
- 페르소나를 "10년 경력 PM"으로 설정하여 전문성 있는 역할 분배 유도
- temperature 0.3 권장 — 창의적 역할 분배보다 일관된 구조화 출력이 중요

**결정된 설계 방향**

- 스키마 + 예시 + 페르소나 3요소를 system prompt에 모두 포함
- 자연어 응답 금지 규칙을 Rules 섹션에 명시
- 출력 텍스트 언어를 한국어로 강제

---

### 3-2. 주간 리뷰 에이전트 프롬프트 설계 과정

**초기 요구사항 (개발자 → Claude)**

```
이번 주 팀원들이 뭘 했는지 입력하면 진단과 다음 주 할 일을 알려주는 AI가 필요해.
무임승차 감지도 되면 좋겠어.
```

**Claude의 설계 제안 포인트**

- `daily_achievement_rate` 필드를 입력 스키마에 추가하여 무임승차 정량 감지 가능
- 달성률 0.5 미만 시 risks에 자동 플래그 규칙을 prompt에 명시
- diagnosis는 2~3문장으로 제한하여 토큰 낭비 방지
- 개인별 next_week_priorities로 팀원 맞춤형 출력 설계

**결정된 설계 방향**

- 달성률 임계값(0.5)을 Rules에 명시
- 진단 텍스트 길이 제한 규칙 추가
- 개인화 우선순위 출력 구조 확정

---

## 4. 개발 단계 협업 로그

> 개발 진행에 따라 아래 형식으로 지속 업데이트한다.

### 형식

```
### [날짜] [작업 내용]

**요청 (개발자 → Cursor)**
- 구체적 요청 내용

**Cursor 생성 결과**
- 생성된 코드/구조 요약

**검토 및 수정 사항**
- 직접 수정한 부분과 이유
```

### 예시 항목

```
### [YYYY-MM-DD] Gemini API 서비스 레이어 초안 생성

요청 : Gemini 2.5 Flash API를 호출하는 서비스 레이어를 만들어줘.
        환경변수에서 키를 읽고, 킥오프와 주간 리뷰 두 함수를 분리해줘.

Cursor 생성 결과 : src/services/gemini.js 초안 생성
                   callKickoffAgent(), callWeeklyReviewAgent() 함수 분리됨

검토 및 수정 사항 : JSON 파싱 실패 fallback 로직 직접 추가
                   에러 로깅 형식 프로젝트 기준에 맞게 수정
```

---

## 5. AI 협업에서 얻은 인사이트

프로젝트를 진행하면서 AI 협업에서 유효했던 패턴과 주의해야 할 점을 기록한다.

### 유효했던 패턴

| 패턴 | 내용 |
|---|---|
| 역할 분리 | 기획·문서는 Claude, 코드는 Cursor로 역할을 나누니 각 AI의 강점이 극대화됨 |
| 제약 조건 명시 | "무료 API만 사용", "혼자 개발" 등 제약을 먼저 제시하니 현실적인 방향 제안이 나옴 |
| 반려 요청 활용 | "이미 흔한 아이디어면 반려해줘"라는 명시적 요청으로 차별화 검증에 AI 활용 |
| 스키마 먼저 설계 | 코드 작성 전 입출력 JSON 스키마를 AI와 함께 먼저 정의하니 개발 방향이 명확해짐 |

### 주의 사항

| 주의 사항 | 내용 |
|---|---|
| 보안 로직 직접 검토 | API 키 관리, 인증 로직은 AI 생성 코드를 그대로 사용하지 않고 반드시 직접 검토 |
| 프롬프트 과신 금지 | AI가 설계한 프롬프트도 실제 응답 테스트 후 수정 필요. 첫 버전이 완벽하지 않음 |
| 문서와 코드 동기화 | AI가 코드를 빠르게 생성하면 문서가 뒤처지는 경향. 주기적 동기화 필요 |

---



### [2026-04-06] 프로젝트 기획 전체 완료

**요청 (개발자 → Claude)**
- 공모전 주제(AI 활용 차세대 교육 솔루션) 분석 및 방향 수립
- 타겟, 페인 포인트, 아이디어 선정 전 과정 협업
- 기획서(PLAN.md), 공모전 리포트(ai-report.md), 프롬프트 설계서(prompt-design.md), 협업 로그, README.md 초안 작성 요청

**Claude 수행 결과**
- 시장 조사: 기존 AI 협업 툴(Asana, ClickUp, Monday.com) 분석 → 전부 기업 대상, 학생 팀플 전용 도구 공백 확인
- Gemini 무료 티어: 2.5 Flash 기준 250 RPD 확인, 선택적 호출 설계로 무료 범위 내 가능 판단
- 아이디어 후보 5개 도출 후 반려 기준 적용 → Teamver 확정
- 전체 docs 구조 및 파일 5개 초안 완성

**검토 및 수정 사항**
- 퀴즈 생성: 500팀 공모전에서 흔한 패턴 → 직접 판단하여 제외
- 포트폴리오 피드백: 시각 작업물 AI 평가 신뢰도 문제 → 직접 판단하여 제외
- 게임 기획서 특화: 심사위원 공감대 부족 우려 → 대학생 전반으로 확장
- Gemini 모델 선택: 비용 0원 유지 원칙 → 직접 결정

---

### [2026-04-06] STEP 01~03 — 프로젝트 초기 세팅, DB 스키마, 백엔드 기반

**요청 (개발자 → Claude)**
- Next.js 16 + Supabase + Gemini 2.5 Flash 스택으로 전체 프로젝트 초기화
- DB 스키마 설계(projects, members, milestones, contribution_logs) 및 마이그레이션 SQL 작성
- Supabase 클라이언트 lazy init(환경변수 누락 시 에러 방지), Gemini 서비스 레이어 구현

**Claude 수행 결과**
- `src/lib/supabase.js`: Proxy 패턴으로 빌드 타임 환경변수 오류 우회
- `src/services/gemini.js`: `callKickoffAgent()`, `callWeeklyReviewAgent()` 분리, JSON 파싱 실패 fallback 포함
- `supabase/schema.sql`: 전체 테이블 + RLS + CASCADE 관계 정의
- API 라우트 초안: `/api/projects`, `/api/kickoff`, `/api/review`, `/api/contributions`
- `.env.example` 작성

**검토 및 수정 사항**
- `NEXT_PUBLIC_` 접두사 필요 여부 직접 검토 (클라이언트 컴포넌트에서도 사용하므로 anon key에 적용)
- Gemini 응답 파싱: 마크다운 코드블록(` ```json `) 포함 응답에 대한 정규식 제거 로직 추가

---

### [2026-04-06] STEP 04~05 — 킥오프 에이전트, 인증·초대 시스템

**요청 (개발자 → Claude)**
- AI 킥오프: 팀원 정보 → Gemini로 역할 분배 + 4~16주 마일스톤 자동 생성 → DB 저장
- Supabase Auth 기반 인증: 아이디/비번 방식(`username@teamver.local` 포맷), 회원가입·로그인 화면
- 초대 코드(8자 대문자) 기반 팀원 참여 플로우 구현

**Claude 수행 결과**
- 킥오프 system prompt: 페르소나 "10년 경력 PM", JSON 스키마 강제, temperature 0.3
- `src/app/api/kickoff/route.js`: 팀원 조립 → Gemini → members/milestones DB 저장
- `src/lib/auth.js`: signIn/signUp/signOut/getSession/getProfile 함수
- `src/app/join/[code]/page.js`: 초대 코드로 팀원 등록 (스킬·성향 입력)
- `src/app/projects/[id]/setup/page.js`: 방장 자신도 팀원으로 등록하는 셀프 세팅 페이지

**검토 및 수정 사항**
- `duration_weeks` NOT NULL 오류: "기한 없음" 선택 시 null 대신 0 삽입으로 해결
- 방장이 AI 킥오프 후 팀원 목록에 포함되지 않는 문제 → setup 페이지로 별도 분리

---

### [2026-04-06~07] STEP 06 — 대시보드 UI 전면 재설계 (물방울 테마)

**요청 (개발자 → Claude)**
- 이모지 전면 제거, 물방울·물 느낌의 쫀득한 UI로 통일
- 로그인 화면: 어두운 배경 + 파문 ripple 애니메이션(캔버스)
- 내부 페이지: `.page-water` 파란 그라디언트 배경, `.btn-jelly` spring 효과, `.input-drop` 포커스 glow
- 프로젝트 메인 화면: 그라디언트 헤더 배너, 카드 glass 효과, 섹션 좌측 accent 바

**Claude 수행 결과**
- `src/components/RainBackground.js`: Canvas API로 top-down 물방울 파문(concentric ellipse rings) 구현
- `src/app/globals.css`: 디자인 토큰 통일(`--accent: #2563eb`), `.btn-jelly` cubic-bezier spring, `.page-water` 다층 radial-gradient
- 프로젝트 대시보드 헤더: `linear-gradient(135deg, #2563eb, #1d4ed8)` 배너 + 반투명 물방울 deco SVG
- 멤버 아바타: 인덱스마다 다른 6색 그라디언트 (블루/퍼플/시안/그린/앰버/핑크)
- 진행률 바: glow shadow 효과

**검토 및 수정 사항**
- 배경이 너무 흰색이라 카드 구분 안 됨 → `.page-water` 파란 채도 강화 (`#e8f0fe` 계열)
- 홈 화면 `.page-water` 배경이 `.bg-white` 사이드바에 묻힘 → 사이드바 레이아웃 분리

---

### [2026-04-07] 팀 채팅 패널 구현

**요청 (개발자 → Claude)**
- 카카오톡 스타일 우측 슬라이드 채팅 패널 (실시간 Supabase Realtime)
- AI 요약/회의록 버튼, 말풍선 디자인, 쫀득한 spring 효과

**Claude 수행 결과**
- `src/components/ChatPanel.js`: 고정 우측 패널, 모바일 오버레이 포함
- `supabase/migration_04_messages.sql`: messages 테이블 (is_ai 포함)
- `supabase/migration_05_realtime.sql`: REPLICA IDENTITY FULL + publication 등록
- `src/app/api/projects/[id]/messages/route.js`: GET/POST
- `src/app/api/projects/[id]/messages/summarize/route.js`: Gemini AI 요약/회의록
- 헤더 2행 구조(타이틀+닫기 / AI버튼 행)로 버튼 줄바꿈 문제 해결

**검토 및 수정 사항**
- AI/회의록 버튼이 "Ai요/약", "회의/록"으로 2줄 깨짐 → `whitespace-nowrap` + `flex-1` 조합으로 해결

---

### [2026-04-07] 기획안 저장소, 파일 자료실, 개인 할일 블록, 관리자 권한

**요청 (개발자 → Claude)**
- 기획안 업로드(AI 킥오프 시 참고), 일반 파일 자료실 (Supabase Storage)
- 멤버별 할일 블록 (체크, 인라인 편집, 삭제) + 실시간 동기화
- 방장이 다른 팀원에게 관리자 권한 부여/해제

**Claude 수행 결과**
- `supabase/migration_06_tasks_files.sql`: tasks, project_files 테이블, is_admin 컬럼, RLS
- `src/components/PlanningDocs.js`: 기획안 업로드/목록/삭제, 프리미엄 게이트(3개/5MB)
- `src/components/FilesSection.js`: 이미지 그리드 프리뷰, 타입 뱃지, 프리미엄 게이트(10개/20MB)
- `src/components/TasksSection.js`: TaskBlock(체크박스·인라인 편집·삭제), AddTaskForm, Realtime 구독
- `src/app/api/members/[id]/admin/route.js`: PATCH is_admin 토글

**검토 및 수정 사항**
- `supabase/migration_07_storage_bucket.sql` 추가: `teamver` 버킷이 미생성 상태로 업로드 실패 → SQL로 버킷+정책 자동 생성

---

### [2026-04-07] 신원 인식 auth 계정 종속 + 할일 진행률·메모 + 컴팩트 멤버 UI

**요청 (개발자 → Claude)**
- 방장에게 "초대 링크로 참여하셨나요?" 메시지가 뜨는 버그: localStorage 의존 → auth UUID 기반으로 전환
- 할일에 메모란 + 0~100% 진행률 슬라이더 추가 (자동 저장)
- 팀원 카드 그리드 → 작은 아이콘 칩 행으로 교체, 클릭 시 프로필 모달 (스킬·성향·DM 버튼)

**Claude 수행 결과**
- `projects/[id]/page.js`: `getSession()` → `userId` 추출 → `project.owner_id === userId` / `member.user_id === userId` 비교로 신원 확정. localStorage는 캐시 역할만 유지
- `supabase/migration_08_task_progress.sql`: tasks에 progress integer(0~100) 컬럼 추가
- `TasksSection.js` 전면 재작성: ▾ 펼치기 → 메모 textarea + range slider (600ms debounce 자동저장), 진행률별 색상(회색/파랑/초록), 멤버 전체 평균 진행률 바
- 멤버 compact chip 행: 내 칩 → 프로필 수정 모달 / 타인 칩 → 프로필 보기 모달 (DM "준비 중" 토스트, 관리자 토글)
- 신원은 Supabase `auth.users.id` (영구 UUID) 기반 → 아이디·비밀번호 변경해도 영향 없음

**검토 및 수정 사항**
- `myName` 파생 방식: localStorage 직접 참조 → `myMember?.name` (DB 기반)으로 통일
- 슬라이더 `appearance: none` + `::-webkit-slider-thumb` 커스텀 CSS로 크로스브라우저 대응

---

## 5. AI 협업에서 얻은 인사이트

프로젝트를 진행하면서 AI 협업에서 유효했던 패턴과 주의해야 할 점을 기록한다.

### 유효했던 패턴

| 패턴 | 내용 |
|---|---|
| 역할 분리 | 기획·문서는 Claude, 코드는 Cursor로 역할을 나누니 각 AI의 강점이 극대화됨 |
| 제약 조건 명시 | "무료 API만 사용", "혼자 개발" 등 제약을 먼저 제시하니 현실적인 방향 제안이 나옴 |
| 반려 요청 활용 | "이미 흔한 아이디어면 반려해줘"라는 명시적 요청으로 차별화 검증에 AI 활용 |
| 스키마 먼저 설계 | 코드 작성 전 입출력 JSON 스키마를 AI와 함께 먼저 정의하니 개발 방향이 명확해짐 |
| 점진적 기능 확장 | 기본 CRUD → 실시간 → AI → 권한 → UX 순으로 레이어를 쌓아 각 단계 검증 후 다음 진행 |
| UI 언어 통일 | "물방울·쫀득" 같은 감각적 키워드를 고정 레퍼런스로 사용하니 AI가 일관된 디자인 방향 유지 |

### 주의 사항

| 주의 사항 | 내용 |
|---|---|
| 보안 로직 직접 검토 | API 키 관리, 인증 로직은 AI 생성 코드를 그대로 사용하지 않고 반드시 직접 검토 |
| 프롬프트 과신 금지 | AI가 설계한 프롬프트도 실제 응답 테스트 후 수정 필요. 첫 버전이 완벽하지 않음 |
| 문서와 코드 동기화 | AI가 코드를 빠르게 생성하면 문서가 뒤처지는 경향. 주기적 동기화 필요 |
| localStorage 과의존 금지 | 초기 신원 인식을 localStorage에만 의존했다가 브라우저 초기화 시 방장 인식 실패 버그 발생. DB 기반 검증이 우선이어야 함 |
| DB 마이그레이션 누락 | 기능 추가 시 프론트 코드는 완성되어도 SQL 마이그레이션 미실행 시 런타임 에러. 체크리스트 필수 |

---

*이 문서는 Claude(Anthropic)와의 AI 협업을 통해 작성되었으며, 개발 진행에 따라 지속 업데이트됩니다.*

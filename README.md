# Teamver

> **AI와 함께 설계하고, AI와 함께 완성하는 학생 팀플 협업 도구**

학생 팀플의 가장 큰 고통 — 역할 갈등과 무임승차 — 을 AI로 해결합니다.
팀 구성 → 역할 설계 → 진행 추적 → 기여도 기록까지 하나의 플로우로 완결됩니다.

이 프로젝트는 **기획부터 구현까지 전 과정을 Claude(Anthropic) 및 Claude Code와 AI 바이브 코딩으로 개발**했습니다.

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| **AI 킥오프** | 팀원 정보 → 도메인 특화 역할 배정 + 마일스톤 자동 설계 |
| **도메인 페르소나** | 프로젝트 주제 자동 감지 → 게임·마케팅·앱·AI 등 9개 분야 특화 응답 |
| **팀 일지** | 기여 기록 → AI 내용 정리 → AI 일지 생성 → 보관함 저장 |
| **팀 채팅** | 실시간 채팅 + AI 요약 + AI 회의록 자동 저장 |
| **집계 에이전트** | 기여·마일스톤·역할 종합 분석 → 팀 건강도·리스크 진단 |
| **AI 보관함** | 킥오프·집계·회의록·팀일지 전체 아카이브 |
| **개인 메시지** | 팀원 간 1:1 DM (실시간, 파일 첨부) |
| **마일스톤 관리** | 진행률 체크, AI 다음 마일스톤 생성 |
| **알림** | 친구 요청·팀원 참가·AI 결과 실시간 알림 |

---

## AI 협업 구조

이 프로젝트는 3개의 AI를 역할별로 분리하여 활용했습니다.

| AI | 역할 |
|---|---|
| **Claude (claude.ai)** | 기획 검증, 시장 조사, 문서 초안, 프롬프트 설계 |
| **Claude Code** | 전체 코드베이스 구현 (컴포넌트, API, DB 쿼리, 스타일링) |
| **Gemini 2.5 Flash** | 서비스 내 AI 기능 런타임 (킥오프, 집계, 일지, 회의록) |

전체 협업 과정은 [`docs/ai-collaboration-log.md`](docs/ai-collaboration-log.md)에 기록되어 있습니다.

---

## 문서

| 문서 | 설명 |
|---|---|
| [`docs/PLAN.md`](docs/PLAN.md) | 전체 기획서 — 문제 정의, 솔루션, AI 에이전트 명세 |
| [`docs/prompt-design.md`](docs/prompt-design.md) | 프롬프트 설계 명세 — 에이전트별 system prompt 전문 |
| [`docs/ai-report.md`](docs/ai-report.md) | 공모전 제출용 AI 활용 리포트 |
| [`docs/ai-collaboration-log.md`](docs/ai-collaboration-log.md) | AI 협업 과정 전체 기록 (기획~개발) |
| [`docs/WORKFLOW.md`](docs/WORKFLOW.md) | 개발 단계별 진행 이력 |

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일링 | TailwindCSS 4 |
| 데이터베이스 | Supabase (PostgreSQL + RLS + Realtime) |
| 인증 | Supabase Auth |
| AI API | Gemini 2.5 Flash (Google AI Studio) |
| 배포 | Vercel |

---

## 로컬 실행

```bash
cp .env.example .env
# GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 입력

npm install
npm run dev
```

Supabase SQL Editor에서 `supabase/` 폴더의 migration 파일을 번호 순서대로 실행 후 사용하세요.

---

## 주의사항

- `.env` 파일은 절대 커밋하지 마세요. API 키 노출에 주의하세요.
- `supabase/migration_24_notifications_definitive.sql`은 알림 시스템의 최종 마이그레이션입니다. 이전 21~23 파일과 중복이 있으므로 24번만 실행해도 됩니다.

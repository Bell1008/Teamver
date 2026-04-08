# Teamver

학생 팀플 전용 AI 협업 설계 도구.

팀 구성 → 역할 설계 → 진행 추적 → 기여도 기록까지 하나의 플로우로 완결하며,
채팅·일지·마일스톤 전반에 AI를 자연스럽게 녹여 팀플 경험을 개선한다.

이 프로젝트는 기획부터 구현까지 **Claude Code / Cursor를 활용한 AI 바이브 코딩**으로 개발되었다.

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| AI 킥오프 | 팀원 정보 입력 → 역할 분배 + 마일스톤 자동 설계 |
| 도메인 페르소나 | 프로젝트 주제 자동 감지 → 게임·마케팅·앱 등 분야 특화 AI 응답 |
| 팀 일지 | 기여 기록 입력 → AI 내용 정리 → AI 일지 생성 → 보관함 저장 |
| 팀 채팅 | 실시간 팀 채팅 + AI 요약 + AI 회의록 보관 |
| 집계 에이전트 | 기여·마일스톤·역할 종합 분석 → 팀 건강도·리스크 진단 |
| AI 보관함 | 킥오프·집계·회의록·일지 전체 아카이브 |
| 개인 메시지 | 팀원 간 1:1 DM (실시간, 파일 첨부) |

---

## 문서

| 문서 | 설명 |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | 전체 기획서 — 문제 정의, 솔루션, AI 에이전트 명세 |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | 개발 단계별 진행 이력 |
| [docs/ai-report.md](docs/ai-report.md) | 공모전 제출용 AI 활용 리포트 |
| [docs/prompt-design.md](docs/prompt-design.md) | 프롬프트 설계 명세 |

---

## 기술 스택

Next.js 16 App Router · TailwindCSS 4 · Supabase (DB·Auth·Realtime·Storage) · Gemini 2.5 Flash · Vercel

---

## 실행

```bash
cp .env.example .env
# GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 입력

npm install
npm run dev
```

Supabase SQL Editor에서 `supabase/migration_01.sql` ~ `migration_14.sql` 순서대로 실행 필요.

---

## 주의

`.env` 파일은 절대 커밋하지 않는다. API 키 노출에 주의할 것.

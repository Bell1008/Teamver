# Teamver

학생 팀플 전용 AI 협업 설계 도구.

팀 구성 → 역할 설계 → 진행 추적 → 기여도 시각화까지 하나의 플로우로 완결하며,
AI를 팀원으로 프로젝트에 포함시켜 실질적 협업 역할을 수행하게 한다.

---

## 문서

| 문서 | 설명 |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | 전체 기획서 — 문제 정의, 솔루션 설계, 기술 스택, 아키텍처 |
| [docs/ai-report.md](docs/ai-report.md) | 공모전 제출용 AI 리포트 |
| [docs/prompt-design.md](docs/prompt-design.md) | AI 에이전트 프롬프트 설계 명세 |
| [docs/ai-collaboration-log.md](docs/ai-collaboration-log.md) | AI 협업 과정 기록 |

## 기술 스택

React · TailwindCSS · Node.js · Supabase · Gemini 2.5 Flash

## 실행

```bash
# 환경변수 설정
cp .env.example .env
# GEMINI_API_KEY 입력 후 저장

# 의존성 설치 및 실행
npm install
npm run dev
```

## 주의

`.env` 파일은 절대 커밋하지 않는다. API 키 노출에 주의할 것.

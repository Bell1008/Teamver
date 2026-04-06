# Teamver — 개발 로그

> AI 기반 학생 팀플 협업 도구. Next.js 16 + Supabase + Gemini 2.5 Flash + Vercel

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일링 | TailwindCSS 4 (`@tailwindcss/postcss`) |
| 백엔드/DB | Supabase (PostgreSQL + RLS + Realtime) |
| 인증 | Supabase Auth (username-only, `@teamver.local` 내부 변환) |
| AI | Gemini 2.5 Flash (JSON 강제 출력, temperature 0.3) |
| 배포 | Vercel (자동 배포, GitHub 연동) |

---

## 구현 단계별 기록

### STEP 01 — 프로젝트 초기 세팅
- Next.js 16 App Router 수동 구성 (대문자 디렉토리 오류 우회)
- TailwindCSS 4 + PostCSS 설정
- jsconfig.json `@/*` 경로 별칭 추가
- `.env.local` 설정 (Supabase URL/Key, Gemini API Key)
- `.gitignore`에 `.env.local` 추가

### STEP 02 — DB 스키마 설계 (Supabase)
**테이블:**
- `projects` — 팀플 프로젝트 (제목, 목표, 과목, 기간)
- `members` — 팀원 (이름, 스킬, 성향, 역할)
- `milestones` — 주차별 마일스톤 (AI 생성)
- `contribution_logs` — 개인 기여 기록
- `profiles` — 유저 프로필 (username, 테마 색상) — migration_03
- `messages` — 팀 채팅 메세지 — migration_04

**마이그레이션 파일:**
- `migration_01_invite_theme.sql` — invite_code, owner_code, theme 컬럼
- `migration_02_duration.sql` — duration_value, duration_unit (기간 단위 확장)
- `migration_03_auth.sql` — profiles 테이블, owner_id/user_id, 트리거
- `migration_04_messages.sql` — 채팅 메세지 테이블

### STEP 03 — Gemini 서비스 레이어
**파일:** `src/services/gemini.js`
- `callKickoffAgent(input)` — 팀원 역할 배정 + 마일스톤 생성
- `callWeeklyReviewAgent(input)` — 주간 기여 분석 + 피드백
- JSON 파싱 2중 폴백 (parse → extractJson → fallback template)
- 프롬프트 파일: `/prompts/kickoff-agent.txt`, `/prompts/weekly-review-agent.txt`

### STEP 04 — AI 킥오프 & 주간 리뷰 API
**파일:** `src/app/api/kickoff/route.js`, `src/app/api/review/route.js`
- 킥오프: DB에서 팀원 조회 → Gemini → members 역할 업데이트 + milestones 생성
- 주간 리뷰: contribution_logs 조회 → Gemini → 피드백 반환

### STEP 05 — 팀원 초대 시스템
- 방장이 워크스페이스 생성 → 6자리 `invite_code` 자동 발급
- 팀원은 코드/링크로 `/join/[code]` 접속 → 본인 이름·스킬·성향 직접 입력
- `owner_code`, `member_code` 로컬스토리지에 저장 (소유권 식별)

### STEP 06 — 프로젝트 기간 단위 확장
**지원 단위:** 시간 / 일 / 주 / 달 / 년 / 기한 없음
- `duration_unit` + `duration_value` 컬럼 추가
- `duration_weeks`는 하위 호환 유지 (0 = 기한 없음)
- 대시보드 D-day 카운터: 단위별 환산 표시

### STEP 07 — 프로젝트 대시보드
**파일:** `src/app/projects/[id]/page.js`
- 헤더: 프로젝트 제목, 기간, D-day 카운터
- 방장 전용: 초대 코드 + 링크 복사, AI 킥오프 버튼, 프로젝트 정보 수정 모달
- 팀원 카드: 역할 배지, 스킬
- 이번 주 마일스톤 체크리스트
- 기여 입력 폼 (`ContributionForm`)
- 주간 리뷰 버튼 (`WeeklyReviewButton`)
- Supabase Realtime 구독 (members, contribution_logs)

### STEP 08 — 인증 시스템 (Supabase Auth)
**파일:** `src/lib/auth.js`
- `signUp(username, password)` — `username@teamver.local` 형식으로 내부 저장
- `signIn(username, password)`, `signOut()`, `getSession()`
- `getProfile(userId)`, `updateTheme(userId, bg, accent)`
- `getUserProjects(userId)` — owner 또는 member인 프로젝트 전부 반환 (중복 제거)
- DB 트리거: 회원가입 시 profiles 자동 생성

**로그인 페이지** (`src/app/page.js`):
- 비 내리는 캔버스 배경 애니메이션 (`RainBackground.js`)
- 유리형(Glassmorphism) 카드 UI
- 물방울 로고, 떠오르는 애니메이션

### STEP 09 — 마이페이지 (`/home`)
**파일:** `src/app/home/page.js`

좌측 사이드바 탭 구조:
| 탭 | 파일 | 상태 |
|----|------|------|
| 팀플 | `ProjectsTab.js` | 완료 |
| 개인메세지 | `MessagesTab.js` | 준비 중 |
| 알림 | `NotificationsTab.js` | 준비 중 |
| 설정 | `SettingsTab.js` | 완료 |

**ProjectsTab:** 그리드 카드 (팀플 목록 + 만들기 + 참여하기)
**SettingsTab:** 배경색/강조색 컬러 피커 + 실시간 미리보기

### STEP 10 — 방장 셀프 등록
**파일:** `src/app/projects/[id]/setup/page.js`
- 팀플 생성 직후 방장도 팀원 등록 화면으로 이동
- 팀원 참여 화면과 동일한 이름/스킬/성향 입력

### STEP 11 — 팀 채팅 + AI 회의록
**파일:** `src/components/ChatPanel.js`
- 우측 슬라이드 패널, 플로팅 버튼으로 토글
- 카카오톡 스타일 (내 메세지 오른쪽, 상대방 왼쪽)
- Supabase Realtime 실시간 동기화
- AI 기능:
  - **AI 요약**: 최근 대화 3~5문장 핵심 요약
  - **회의록**: 공식 양식 (일시/참석자/논의/결정/Action Items)
  - AI 결과물은 채팅에 기록으로 남음

---

## 테마 시스템

- **개인별 테마**: 유저마다 `theme_bg`(배경) + `theme_accent`(강조색) 저장
- **설정 위치**: 마이페이지 > 설정 탭
- **적용 범위**: 모든 프로젝트 페이지, 사이드바 강조, 버튼, 카드

---

## UI 디자인 원칙

- **물방울 모티프**: 로고, 물방울 float 애니메이션, 빗소리 배경
- **Jelly 버튼**: `cubic-bezier(0.34, 1.56, 0.64, 1)` 스프링 효과
- **입력 포커스**: 블루 글로우 (`box-shadow: 0 0 0 3px rgba(59,130,246,0.15)`)
- **카드 hover**: 살짝 뜨는 translateY(-3px) + 블루 그림자
- **이모지 없음**: 모든 아이콘은 SVG

---

## 환경 변수 (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

---

## Supabase 설정 체크리스트

- [ ] Auth > Settings > **Confirm email 비활성화**
- [ ] SQL Editor에서 migration 파일 순서대로 실행
  - `migration_01_invite_theme.sql`
  - `migration_02_duration.sql`
  - `migration_03_auth.sql`
  - `migration_04_messages.sql`
- [ ] Realtime 활성화: `members`, `contribution_logs`, `messages` 테이블

---

## 알려진 제한사항 / 추후 개선

- 개인 메세지 탭 미구현
- 알림 탭 미구현
- 기여 로그 통계/시각화 미구현
- 프로필 사진 업로드 미구현
- 모바일 최적화 추가 필요

# GitHub 정리 명령어

## 1. 삭제할 파일들

```bash
# DEVLOG.md 삭제 (내부 메모, 심사용 불필요. 핵심 내용은 ai-collaboration-log.md에 통합됨)
git rm DEVLOG.md

# 중복 마이그레이션 삭제
# migration_22: migration_24에 통합됨
git rm supabase/migration_22_fix_notifications_rls.sql

# migration_23: migration_20 + migration_24에 분산됨 (safe 버전이지만 24로 대체)
# 단, 23은 실행 안내 문서 역할도 하므로 유지해도 됨. 선택적 삭제.
# git rm supabase/migration_23_realtime_safe.sql

git commit -m "chore: remove DEVLOG.md and redundant migration files"
```

## 2. 업데이트할 파일들 (수정된 파일로 교체)

```bash
# 작업된 파일들을 저장소에 복사 후 커밋
cp [작업파일]/README.md ./README.md
cp [작업파일]/docs/PLAN.md ./docs/PLAN.md
cp [작업파일]/docs/WORKFLOW.md ./docs/WORKFLOW.md
cp [작업파일]/docs/ai-collaboration-log.md ./docs/ai-collaboration-log.md
cp [작업파일]/docs/ai-report.md ./docs/ai-report.md
cp [작업파일]/docs/prompt-design.md ./docs/prompt-design.md

git add README.md docs/
git commit -m "docs: update all documentation for submission"
```

## 3. .env 파일 미포함 확인

```bash
# .env 파일이 추적되고 있는지 확인 (아무것도 출력되지 않아야 정상)
git ls-files | grep "^\.env$"

# API 키 하드코딩 검색 (아무것도 출력되지 않아야 정상)
grep -r "AIza" src/ --include="*.js"
grep -r "GEMINI_API_KEY" src/ --include="*.js" | grep -v "process.env"
```

## 4. 최종 push

```bash
git push origin main
```

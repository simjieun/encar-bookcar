# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 프로젝트

엔카북카(`Encar Bookcar`) — 동료가 추천한 책을 발견하고 나누는 사내 북클럽 앱.
UI 문구, 에러 메시지, 테스트 설명은 모두 한국어로 작성한다.

## 명령어

```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm test           # vitest run (전체)
npm run lint       # eslint (.next 제외)
npm run typecheck  # tsc --noEmit
npm run db:generate  # drizzle-kit generate — db/schema.ts 변경 후 실행

npx vitest run tests/book-discovery.test.tsx        # 파일 하나만
npx vitest run -t "책 제목과 저자로 목록을 검색한다"  # 테스트 하나만
npx vitest                                          # watch 모드
```

Node >= 22.13. 패키지는 ESM(`"type": "module"`)이므로 설정 파일도 ESM으로 작성한다.

## 스택 / 구조

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · Drizzle(postgres-js) · TanStack Query · Zod. 경로 별칭 `@/*` → 루트 (tsconfig + vitest.config 양쪽에 등록되어 있음).

- `app/` — App Router. `layout.tsx`가 `Providers`(TanStack Query, `staleTime` 60초)로 감싼다. 클라이언트 훅이 필요한 곳만 `"use client"`.
- `components/` — 재사용 UI. 현재 `book-discovery.tsx`.
- `db/` — `schema.ts`(Drizzle 테이블) + `index.ts`(`getDb()`).
- `lib/schemas/` — Zod 입력 스키마. 폼/서버 액션 검증은 여기 것을 재사용한다.
- `tests/` — Vitest + jsdom + Testing Library, `tests/setup.ts`가 jest-dom 매처를 등록.

## 스타일링 규약 (중요)

Tailwind 유틸리티만으로 작성하지 않는다. `app/globals.css`(약 880줄)에 디자인 시스템이 들어 있다:

- `:root` CSS 변수(`--brand`, `--strong`, `--body`, `--muted`, `--surface`, `--border`)와 `@theme inline`으로 노출한 Tailwind 토큰(`text-strong`, `bg-surface` 등).
- `site-container`, `section-heading-row`, `section-kicker`, `nav-link`, `book-grid`, `book-card`, `book-search`, `status available|reading`, `cover-{blue|yellow|green|navy}`, `empty-books` 같은 시맨틱 클래스.

새 UI는 **먼저 globals.css에 기존 클래스가 있는지 확인하고 재사용**하고, 없으면 같은 자리에 같은 방식으로 추가한다. 간격·정렬 정도의 일회성 조정에만 Tailwind 유틸리티를 섞는다. 아이콘은 `lucide-react`, 색상은 하드코딩 대신 CSS 변수/테마 토큰을 쓴다.

## DB

DB 접근은 반드시 `getDb()`(`db/index.ts`)를 거친다. lazy singleton이라 모듈 import 시점이 아니라 **호출 시점에** `DATABASE_URL`을 검사한다 — DB 없이도 빌드·테스트가 돌아가는 이유이므로, 모듈 최상위에서 커넥션을 만들지 말 것.

`db/schema.ts`를 바꾸면 `npm run db:generate`로 마이그레이션을 생성한다. 주의: `drizzle/meta/_journal.json`이 `dialect: "sqlite"`인 채로 남아 있어 `drizzle.config.ts`의 `postgresql`과 어긋난다. 첫 마이그레이션을 만들 때 이 파일을 정리해야 한다.

## 현재 구현 범위

반응형 홈 화면과 클라이언트 사이드 책 검색 데모까지만 동작한다. `components/book-discovery.tsx`의 책 목록과 `app/page.tsx`의 `bookStats`는 **하드코딩**이며 DB와 연결되어 있지 않다.

설치만 되어 있고 아직 배선되지 않은 것들 — 기능을 붙일 때 새 라이브러리를 추가하기 전에 이것부터 쓴다:

- `better-auth` — 로그인/회원가입 미구현
- `react-hook-form` + `@hookform/resolvers` — 책 등록 폼 미구현 (`lib/schemas/book.ts`의 `bookSchema`와 연결할 것)
- `@playwright/test` — E2E 테스트·스크립트 없음

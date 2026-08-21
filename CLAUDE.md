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
- `components/` — 재사용 UI. 도메인별 하위 폴더(`auth/`, `books/`, `loans/`, `members/`, `admin/`).
- `db/` — `schema.ts`(Drizzle 테이블) + `index.ts`(`getDb()`).
- `lib/*-data.ts` — 서버 전용 데이터 접근(`book-data`, `loan-data`, `member-data`). 최상단에 `import 'server-only'`.
- `lib/schemas/` — Zod 입력 스키마. 폼/서버 액션 검증은 여기 것을 재사용한다.
- `tests/` — Vitest + jsdom + Testing Library, `tests/setup.ts`가 jest-dom 매처를 등록.

## 스타일링 규약 (중요)

Tailwind 유틸리티만으로 작성하지 않는다. `app/globals.css`(약 2,800줄)에 디자인 시스템이 들어 있다:

- `:root` CSS 변수(`--brand`, `--strong`, `--body`, `--muted`, `--surface`, `--border`)와 `@theme inline`으로 노출한 Tailwind 토큰(`text-strong`, `bg-surface` 등).
- `site-container`, `section-heading-row`, `section-kicker`, `nav-link`, `book-grid`, `book-card`, `book-search`, `status available|reading`, `cover-{blue|yellow|green|navy}`, `empty-books` 같은 시맨틱 클래스.

새 UI는 **먼저 globals.css에 기존 클래스가 있는지 확인하고 재사용**하고, 없으면 같은 자리에 같은 방식으로 추가한다. 간격·정렬 정도의 일회성 조정에만 Tailwind 유틸리티를 섞는다. 아이콘은 `lucide-react`, 색상은 하드코딩 대신 CSS 변수/테마 토큰을 쓴다.

## DB

공유 PostgreSQL(Supabase)에 postgres-js로 붙는다. DB 접근은 반드시 `getDb()`(`db/index.ts`)를 거친다. lazy singleton이라 모듈 import 시점이 아니라 **호출 시점에** `DATABASE_URL`을 검사한다 — 모듈 최상위에서 커넥션을 만들지 말 것.

- `DATABASE_URL` — 앱 런타임. Supabase 트랜잭션 풀러(6543)라서 `postgres()`에 `prepare: false`가 필수다.
- `DIRECT_URL` — `drizzle.config.ts`가 쓰는 마이그레이션용 direct 연결(5432). DDL과 advisory lock 때문에 풀러로는 안 된다.
- `TEST_DATABASE_URL` — 테스트 전용. `tests/setup.ts`가 이 값으로 `DATABASE_URL`을 덮어쓰고, 없으면 지운다. 운영 DB 오염 방지 장치이므로 우회하지 말 것.

`db/schema.ts`를 바꾸면 `npm run db:generate`로 마이그레이션을 생성하고 `npm run db:migrate`로 적용한다. 런타임에도 `ensureDatabase()`가 `drizzle/`를 읽어 마이그레이션을 적용하므로, `next.config.ts`의 `outputFileTracingIncludes`에서 이 폴더를 빼면 배포 시 죽는다.

## 인증

Better Auth(`lib/auth.ts`)로 이메일·비밀번호 로그인을 처리한다. 서버에서는 `getCurrentSession()`(`lib/auth-session.ts`), 클라이언트에서는 `authClient`(`lib/auth-client.ts`)를 쓴다.

- 비밀번호 규칙(영문+숫자, 8자 이상)은 `lib/schemas/auth.ts`의 Zod 스키마와 `lib/auth.ts`의 before 훅 **두 곳**에서 검사한다. 규칙을 바꾸면 양쪽을 같이 고친다.
- 새 비밀번호가 정해지는 경로(`/sign-up/email`, `/change-password`, `/admin/set-user-password`)는 before 훅 한 자리에서 함께 검사한다. 경로를 늘리면 이 목록에 추가한다.
- `ALLOWED_EMAIL_DOMAINS`로 가입 가능한 이메일 도메인을 제한한다. 비워두면 전부 허용.
- admin 플러그인을 쓴다. `user.role === 'admin'`인 사람만 `/admin/*`에 접근하며, 권한이 없으면 `notFound()`로 화면 존재 자체를 숨긴다. 첫 관리자는 DB에서 직접 지정한다(README 참고).

비밀번호 분실은 **메일 발송 없이** 관리자가 처리한다. `/admin/members`에서 임시 비밀번호를 발급해 본인에게 전달하고, 본인이 `/profile`에서 바꾼다. 메일 발송기를 새로 붙이지 말 것.

## 현재 구현 범위

홈·책 목록·책 등록/수정·대출/예약·회원 관리·독서 피드까지 DB와 연결되어 동작한다. 하드코딩된 데이터는 없다.

피드(`/feeds`)는 **내가 빌린 이력이 있는 책**(loans가 BORROWED·RETURN_REQUESTED·RETURNED)에만 쓸 수 있고, 목록은 전체 공개다. 본문은 TUI Editor 마크다운 원문으로 저장하고 렌더링은 TUI Viewer가 sanitize해서 처리한다 — HTML을 직접 주입하지 말 것. React 래퍼(`@toast-ui/react-editor`)는 peer가 React 17이라 쓰지 않고, vanilla 인스턴스를 `useEffect` 안에서 동적 import한다(`components/feeds/markdown-{editor,viewer}.tsx`). 이 패키지는 `exports`에 types 조건이 없어 tsconfig `paths`로 타입 경로를 직접 지정해 두었다.

설치만 되어 있고 아직 배선되지 않은 것 — 기능을 붙일 때 새 라이브러리를 추가하기 전에 이것부터 쓴다:

- `@playwright/test` — E2E 테스트·스크립트 없음

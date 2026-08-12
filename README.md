# 엔카북카 (Encar Bookcar)

동료가 추천하는 책을 발견하고 나누는 사내 북클럽 애플리케이션입니다.

## 시작하기

Node.js 22.13 이상에서 의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

### 데이터베이스

팀 전체가 같은 데이터를 보도록 공유 PostgreSQL(Supabase)에 연결합니다. Supabase 대시보드의 Connect에서 두 종류의 연결 문자열을 받아 `.env.local`에 넣습니다.

```dotenv
# 앱 런타임 — Transaction pooler (포트 6543)
DATABASE_URL=postgresql://...@...pooler.supabase.com:6543/postgres?sslmode=require
# 마이그레이션 — Direct 연결 (포트 5432)
DIRECT_URL=postgresql://...@db....supabase.co:5432/postgres?sslmode=require
# 테스트 전용 — 운영 DB와 반드시 분리
TEST_DATABASE_URL=postgresql://...
```

스키마를 적용합니다. `db/schema.ts`를 바꾼 뒤에는 `npm run db:generate`로 마이그레이션을 생성한 다음 다시 실행합니다.

```bash
npm run db:migrate
```

`npm test`는 `TEST_DATABASE_URL`이 가리키는 DB에 실제 행을 씁니다. 운영 DB를 절대 지정하지 마세요. 별도 Supabase 프로젝트를 만들거나 로컬 PostgreSQL을 씁니다.

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres --name bookcar-test postgres:17
```

운영 빌드 전에는 `.env.example`을 복사해 `.env.local`을 만들고 `BETTER_AUTH_SECRET`을 32자 이상의 무작위 값으로 설정해야 합니다. 회사 이메일만 가입시키려면 `ALLOWED_EMAIL_DOMAINS`에 허용할 도메인을 쉼표로 구분해 입력합니다. 비워두면 모든 정상 이메일을 허용합니다.

```bash
cp .env.example .env.local
openssl rand -base64 32
```

### 카카오 책 검색 설정

카카오 디벨로퍼스에서 애플리케이션을 등록한 다음 REST API 키를 `.env.local`에 추가합니다. 키는 서버 Route Handler에서만 사용되며 브라우저로 전달되지 않습니다.

```dotenv
KAKAO_REST_API_KEY=발급받은_REST_API_키
```

## MVP 구현 범위

- `/signup`: 이름, 회사 이메일, 비밀번호 회원가입
- `/login`: 이메일과 비밀번호 로그인
- `/profile`: 로그인 사용자만 볼 수 있는 기본 프로필
- Better Auth 기반 세션 유지와 로그아웃
- 중복 가입, 잘못된 로그인, 가입·로그인 시도 제한
- 보호 페이지 접근 차단과 로그인 후 원래 페이지 복귀
- Zod 기반 클라이언트 검증과 서버 비밀번호·이메일 정책
- `/books`: 실제 등록 도서 목록, 제목·저자 검색, 상태 필터, 정렬과 페이지네이션
- `/books/new`: 카카오 책 검색 결과에서 표지와 도서 정보를 선택하고 현재 대여자를 입력해 등록
- `/books/[bookId]`: 책 상세, 등록자·현재 대여자·예약 순서 표시
- `/books/[bookId]/edit`: 등록자 전용 수정 및 삭제
- `/loans`: 내가 빌린 책, 빌려준 책과 전체 대여 이력
- `/loans/requests`: 책 등록자가 확인하는 선입선출 예약 대기열
- 대여 가능 책은 즉시 대여, 대여 중인 책은 신청 시간 순으로 예약
- 반납 완료 또는 대여자 변경 시 첫 예약자에게 우선 대여
- 한 책당 한 명의 현재 대여자와 회원별 한 건의 활성 예약을 보장하는 DB 제약조건
- 모든 대여 상태 변경의 서버 권한 검사와 트랜잭션 처리
- 홈 화면의 실제 도서 데이터 연동

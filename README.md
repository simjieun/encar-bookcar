# 엔카북카 (Encar Bookcar)

동료가 추천하는 책을 발견하고 나누는 사내 북클럽 애플리케이션입니다.

## 시작하기

Node.js 22.13 이상에서 의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

로컬 데이터는 별도 PostgreSQL 설치 없이 `.data/encar-bookcar`에 저장됩니다. 처음 요청할 때 Drizzle 마이그레이션이 자동으로 적용됩니다.

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
- `/books/new`: 카카오 책 검색 결과에서 표지와 도서 정보를 선택해 등록
- `/books/[bookId]`: 책 상세, 등록자와 보관 장소 표시
- `/books/[bookId]/edit`: 등록자 전용 수정 및 삭제
- 홈 화면의 실제 도서 데이터 연동

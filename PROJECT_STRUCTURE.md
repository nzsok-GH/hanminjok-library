# 한민족 한글학교 도서관 앱 — 프로젝트 구조

## 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 14 (App Router) | 모바일/PC 모두 지원, PWA 가능 |
| 데이터베이스 | Supabase (PostgreSQL) | 무료, 실시간 업데이트, 관계형 DB |
| 이미지 저장 | Cloudinary | 도서 표지, 세트 사진, CDN 자동 |
| 인증 | NextAuth.js + MS365 SSO + GitHub | 학교 Microsoft 365 계정으로 로그인 (GitHub 폴백) |
| 배포 | Vercel | GitHub 연동 자동 배포, 무료 |
| 스타일 | Tailwind CSS | 빠른 반응형 UI |
| QR 스캔 | html5-qrcode | 모바일 카메라 QR 스캔 |
| QR 생성 | qrcode.js | 도서/학생 QR 코드 생성 |
| 책 인식 | Google Cloud Vision API (OCR) | 세트 사진 → 텍스트 추출 → 책 목록 인식, 무료 월 1,000회 |
| 책 정보 | Google Books API | ISBN/제목으로 메타데이터 자동 입력 |

## 파일 구조

```
hanminjok-library/
├── prisma/
│   └── schema.prisma          ← DB 스키마 (books, students, loans, teachers)
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← 앱 레이아웃 (PWA 메타데이터)
│   │   ├── page.tsx            ← 로그인 페이지 (GitHub OAuth)
│   │   ├── dashboard/
│   │   │   └── page.tsx        ← 대시보드 (현황 통계)
│   │   ├── books/
│   │   │   ├── page.tsx        ← 도서 목록/검색
│   │   │   ├── add/page.tsx    ← 도서 추가 (바코드 스캔 / 수동 입력) ⭐
│   │   │   └── [id]/page.tsx   ← 도서 상세
│   │   ├── qr-scan/
│   │   │   └── page.tsx        ← QR 스캔 대출/반납 ⭐
│   │   ├── students/
│   │   │   ├── page.tsx        ← 학생 목록
│   │   │   └── [id]/page.tsx   ← 학생 상세 + 대출이력
│   │   ├── loans/
│   │   │   └── page.tsx        ← 대출 현황 + 연체 목록
│   │   ├── reports/
│   │   │   └── page.tsx        ← 통계 보고서
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── books/
│   │       │   ├── route.ts           ← GET(목록) POST(추가)
│   │       │   ├── [id]/route.ts      ← GET PUT DELETE
│   │       │   ├── by-code/[code]/route.ts ← QR 코드로 조회
│   │       │   ├── scan-set/route.ts  ← 📷 세트 사진 → GCV OCR → 일괄 등록 ⭐
│   │       │   └── lookup/route.ts       ← ISBN/제목으로 Google Books 조회
│   │       ├── loans/
│   │       │   ├── checkout/route.ts  ← 대출 처리 ⭐
│   │       │   ├── return/route.ts    ← 반납 처리 ⭐
│   │       │   └── overdue/route.ts   ← 연체 목록
│   │       ├── students/
│   │       │   ├── route.ts
│   │       │   └── by-code/[code]/route.ts
│   │       ├── upload/route.ts        ← Cloudinary 이미지 업로드
│   │       └── reports/route.ts       ← 통계 데이터
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Providers.tsx          ← NextAuth SessionProvider
│   │   │   ├── LoginPage.tsx          ← GitHub 로그인 화면
│   │   │   ├── DashboardClient.tsx    ← 대시보드 UI
│   │   │   └── Navbar.tsx             ← 하단 네비게이션 (모바일)
│   │   ├── books/
│   │   │   ├── BookCard.tsx
│   │   │   ├── BookSearch.tsx
│   │   │   └── SetScanUploader.tsx    ← 세트 사진 업로드 UI
│   │   ├── loans/
│   │   │   └── LoanTable.tsx
│   │   ├── students/
│   │   │   └── StudentCard.tsx
│   │   └── qr/
│   │       ├── QRScanner.tsx          ← 카메라 QR 스캔 컴포넌트
│   │       └── QRGenerator.tsx        ← QR 코드 생성/출력
│   └── lib/
│       ├── auth.ts                    ← NextAuth 설정
│       ├── prisma.ts                  ← Prisma 클라이언트
│       └── cloudinary.ts              ← Cloudinary 유틸
├── .env.example                       ← 환경변수 예시
├── package.json
└── next.config.js
```

## 데이터베이스 스키마

- **teachers**: GitHub 계정 연동 선생님 (admin/teacher 권한)
- **students**: 학생 정보 + 고유 QR 코드
- **books**: 도서 정보 + Cloudinary 표지 이미지 + QR 코드
- **book_sets**: 도서 세트 (시리즈 묶음)
- **loans**: 대출 기록 (ACTIVE/RETURNED/OVERDUE/EXTENDED)

## 핵심 기능

### 📷 세트 사진 → 일괄 등록
1. 세트 사진 촬영/업로드
2. Cloudinary 저장
3. OpenAI GPT-4o Vision으로 책 제목/저자 인식
4. Google Books API로 메타데이터(ISBN, 표지, 출판사) 조회
5. 중복 체크 후 DB 일괄 저장

### 📱 QR 스캔 대출/반납
1. 대출/반납 모드 선택
2. 학생 QR 카드 스캔
3. 도서 QR 코드 스캔
4. 확인 후 처리 (재고 자동 업데이트)

## 설정 필요 서비스

1. **Supabase** — supabase.com (무료)
2. **Cloudinary** — cloudinary.com (무료 25GB)
3. **GitHub OAuth App** — github.com/settings/developers
4. **Google Books API** — console.cloud.google.com (무료 1000회/일)
5. **Google Cloud Vision API** — console.cloud.google.com (무료 월 1,000회)
6. **Vercel** — vercel.com (무료)

---

## 변경 이력

### v1.1 — Google Cloud Vision + 도서 개별 등록

**변경 사항**

- `scan-set/route.ts` — OpenAI GPT-4o Vision → Google Cloud Vision API (OCR) 교체
  - 무료 월 1,000회 사용 가능 (Google 계정만 있으면 됨)
  - 이미지에서 텍스트 추출 후 Google Books API로 책 제목 매칭
  - 스마트 필터링: 4자 미만, 숫자만, 흔한 비제목 단어 자동 제외
  - 환경변수: `OPENAI_API_KEY` → `GOOGLE_CLOUD_VISION_API_KEY`

- `api/books/lookup/route.ts` — 신규 생성
  - GET `/api/books/lookup?isbn=xxx` — ISBN으로 도서 조회
  - GET `/api/books/lookup?title=xxx` — 제목으로 도서 조회
  - Google Books API 기반, API 키 없이도 동작 (한도 낮음)

- `books/add/page.tsx` — 도서 개별 등록 페이지 신규 생성
  - 탭 1: 바코드 스캔 (html5-qrcode, ISBN 바코드 지원)
    - 스캔 성공 시 자동으로 도서 정보 조회 → 폼 자동 완성
  - 탭 2: 직접 입력
    - 필드: 제목, 저자, 출판사, 출판년도, ISBN, 언어, 분류, 서가위치, 수량
    - "제목으로 검색" 버튼으로 Google Books API 자동 완성
    - 표지 이미지 URL 미리보기

**필요 설정**

1. Google Cloud Console → Vision API 활성화
2. API 키 발급 → `.env.local`에 `GOOGLE_CLOUD_VISION_API_KEY=` 추가
3. `npm install html5-qrcode` (바코드 스캔 라이브러리)

### v1.2 — MS365 SSO + 반응형 디바이스 라우팅

**변경 사항**

- `src/middleware.ts` — 신규 생성
  - User-Agent 기반 모바일 감지 (iPhone, Android, Mobile 키워드)
  - 인증된 사용자가 `/` 접근 시 → 데스크톱/태블릿: `/dashboard`, 폰: `/qr-scan`
  - NextAuth JWT 쿠키로 인증 상태 확인

- `src/components/ui/DeviceRedirect.tsx` — 신규 생성
  - 클라이언트 사이드 폴백 리다이렉트 (미들웨어 미처리 케이스 보완)
  - `window.innerWidth < 768` 기준으로 모바일 판단

- `src/components/ui/Navbar.tsx` — 신규 생성
  - `<MobileNav>`: 하단 고정 탭바 (도서, 대출/반납, 학생, 현황) — `md:hidden`
  - `<DesktopSidebar>`: 좌측 사이드바 — `hidden md:flex`
  - `usePathname()` 기반 현재 탭 하이라이트

- `src/components/ui/DashboardClient.tsx` — 신규 생성
  - 모바일 (< 768px): 헤더 + 오늘 통계 카드 + 빠른 실행 버튼 (대출/반납/도서추가)
  - 태블릿/데스크톱: 사이드바 + 전체 대시보드 뷰

- `src/lib/auth.ts` — MS365 SSO 추가
  - `MicrosoftEntraID` 프로바이더 추가 (학교 Azure AD 테넌트)
  - GitHub 프로바이더 폴백으로 유지

- `src/components/ui/LoginPage.tsx` — 신규 생성
  - Microsoft 365 로그인 버튼 (파란색, 1순위)
  - GitHub 로그인 버튼 (어두운색, 2순위)
  - 학교명 "한민족 한글학교 도서관" 표시

**필요 설정 업데이트**

6. **Azure AD App Registration** — portal.azure.com
   - Azure Active Directory → App Registrations → New registration
   - Redirect URI: `https://yourdomain.com/api/auth/callback/azure-ad`
   - Certificates & secrets → New client secret 발급
   - `.env.local`에 `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` 추가

**현재 설정 필요 서비스**

1. **Supabase** — supabase.com (무료)
2. **Cloudinary** — cloudinary.com (무료 25GB)
3. **GitHub OAuth App** — github.com/settings/developers (폴백용)
4. **Google Books API** — console.cloud.google.com (무료 1000회/일)
5. **Google Cloud Vision API** — console.cloud.google.com (무료 월 1,000회)
6. **Azure AD App Registration** — portal.azure.com (학교 MS365 SSO)
7. **Vercel** — vercel.com (무료)

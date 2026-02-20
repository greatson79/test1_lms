# 리팩토링 계획서

> 분석 기준일: 2026-02-20
> 대상 코드베이스: `test1` (Next.js 15 + Hono + Supabase)

---

## 1. 코드 Smell 목록 및 우선순위

아래 표는 발견된 코드 smell을 **긴급도(높을수록 즉시 조치 필요)** 기준으로 정렬한 것입니다.

| # | 코드 Smell | 위치 | 긴급도 | 복잡도 | 테스트 가능 |
|---|-----------|------|:------:|:------:|:-----------:|
| 1 | 레이어 경계 위반 (컴포넌트/훅에서 직접 Supabase 호출) | onboarding-form.tsx, login/page.tsx, home page.tsx, useEnrollMutation.ts | 9 | 5 | ✅ |
| 2 | 에러 핸들링 패턴 불일치 (try-catch / if-error / 혼합 3가지) | features/*/backend/route.ts, service.ts 전반 | 8 | 4 | ✅ |
| 3 | SRP 위반 - 라우터 핸들러 과다 책임 | enrollments/backend/route.ts (인증+파싱+검증+서비스+로깅+응답) | 8 | 5 | ✅ |
| 4 | DRY 위반 - 인증 헤더 첨부 패턴 중복 | useLearnerDashboardQuery.ts, useCourseListQuery.ts, useEnrollMutation.ts | 8 | 2 | ✅ |
| 5 | 함수 길이 초과 - 서비스 레이어 | getLearnerDashboard (140줄), enrollCourse (64줄), listCourses (75줄) | 7 | 5 | ✅ |
| 6 | 테스트 불가 비즈니스 로직 (DB 접근과 혼합) | enrollCourse 내 신규/재수강 판단 로직 | 7 | 6 | ✅ |
| 7 | 타입 안전성 부재 (as unknown as 캐스팅) | dashboard/service.ts, courses/service.ts | 7 | 5 | ✅ |
| 8 | DRY 위반 - Bearer 토큰 추출 중복 | withAuth 미들웨어 및 기타 라우트 | 6 | 2 | ✅ |
| 9 | DRY 위반 - 에러 로깅 패턴 중복 | features/*/backend/route.ts 4곳 이상 | 6 | 3 | ✅ |
| 10 | 함수 길이 초과 - 컴포넌트 | SignupPage (289줄), app/page.tsx (309줄), OnboardingForm (166줄) | 6 | 4 | ✅ |
| 11 | DRY 위반 - UUID 정규식 중복 | courses/route.ts, enrollments/route.ts | 5 | 2 | ✅ |
| 12 | DRY 위반 - Supabase 조인 쿼리 중복 | courses/service.ts, dashboard/service.ts | 5 | 4 | ✅ |
| 13 | Magic String/Number | route.ts들의 '23505', TOAST_REMOVE_DELAY = 1000000 | 5 | 2 | ✅ |
| 14 | 에러 메시지 서버/클라이언트 동기화 부재 | features/*/backend/error.ts vs 컴포넌트 하드코딩 | 4 | 3 | ✅ |
| 15 | 환경 변수 검증 중복 | src/lib/env.ts vs src/backend/config/index.ts | 4 | 3 | ✅ |

---

## 2. 코드 Smell 상세 분석 및 조치 방안

---

### [Smell-01] 레이어 경계 위반

**긴급도: 9 / 복잡도: 5 / 테스트: 가능**

**문제:**
```
components/onboarding-form.tsx → getSupabaseBrowserClient() 직접 호출
app/(auth)/login/page.tsx     → getSupabaseBrowserClient() 직접 호출
app/page.tsx                  → getSupabaseBrowserClient() 직접 호출
features/enrollments/hooks/useEnrollMutation.ts → Supabase 직접 호출
```

`@tanstack/react-query` 훅과 컴포넌트가 직접 Supabase 클라이언트를 호출하고 있어 HTTP 레이어(`api-client`)를 완전히 우회합니다. 이로 인해 API 응답 캐싱, 일관된 에러 처리, 로깅이 불가능합니다.

**조치 방안:**
1. `src/features/auth/hooks/useSession.ts` 생성 — Supabase 세션 조회를 훅으로 추상화
2. `onboarding-form.tsx`의 Supabase 직접 호출 → `PATCH /api/profiles/onboarding` API 라우트 생성 후 `apiClient` 경유
3. `login/page.tsx`의 `signInWithPassword` → `features/auth/hooks/useLoginMutation.ts` 훅으로 분리
4. `app/page.tsx`의 역할 조회 → `useSession` + `useRoleGuard` 조합으로 대체
5. `useEnrollMutation.ts`의 Supabase 직접 호출 → `POST /api/enrollments` API 경유

**기대 효과:** 레이어 분리, 목(Mock) 테스트 가능, API 중앙 관리 가능

---

### [Smell-02] 에러 핸들링 패턴 불일치

**긴급도: 8 / 복잡도: 4 / 테스트: 가능**

**문제:**
```typescript
// 패턴 A - try/catch
try { ... } catch (e) { return c.json(failure(...), 500) }

// 패턴 B - if 체크
const { data, error } = await supabase...
if (error) return c.json(failure(...), 500)

// 패턴 C - 혼합
const result = serviceCall()
if (!result.ok) { logger.error(...); return c.json(...) }
```

**조치 방안:**
1. `src/backend/http/result.ts`에 `Result<T, E>` 타입 공식 도입 (`ts-pattern` 활용)
2. 서비스 함수는 무조건 `{ ok: true, data }` 또는 `{ ok: false, error, code }` 반환
3. 라우트 핸들러는 `result.ok` 체크 단일 패턴으로 통일
4. `errorBoundary()` 미들웨어가 uncaught exception을 포착하도록 보강

```typescript
// 목표 통일 패턴
const result = await service.getLearnerDashboard(supabase, userId)
if (!result.ok) {
  return respond(c, failure(result.error, result.code), result.status)
}
return respond(c, success(result.data), 200)
```

---

### [Smell-03] SRP 위반 - 라우터 핸들러

**긴급도: 8 / 복잡도: 5 / 테스트: 가능**

**문제:**
단일 라우트 핸들러가 다음 8가지 책임을 모두 담당:
1. 인증 토큰 추출
2. 역할 검증
3. 요청 파라미터 파싱
4. Zod 스키마 검증
5. 서비스 호출
6. 에러 로깅
7. 성공 응답 생성
8. 실패 응답 생성

**조치 방안:**
1. 인증/역할 검증 → `withAuth()` + `withRole('instructor')` 미들웨어 체인으로 분리 (이미 일부 적용)
2. Zod 파싱 → `validateBody(schema)` 미들웨어 헬퍼 생성
3. 에러 로깅 → `errorBoundary()` 미들웨어에 위임

```typescript
// 목표 라우트 핸들러 형태
app.post(
  '/api/instructor/courses/:courseId/assignments',
  withAuth(),
  withRole('instructor'),
  validateBody(createAssignmentSchema),
  async (c) => {
    const body = c.get('validatedBody')
    const result = await service.createAssignment(...)
    if (!result.ok) return respond(c, failure(result.error), result.status)
    return respond(c, success(result.data), 201)
  }
)
```

---

### [Smell-04] DRY 위반 - 인증 헤더 첨부 패턴 중복

**긴급도: 8 / 복잡도: 2 / 테스트: 가능**

**문제:**
```typescript
// 3개 훅에서 동일 패턴 반복
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
const headers = token ? { Authorization: `Bearer ${token}` } : {}
const res = await apiClient.get('/api/...', { headers })
```

**조치 방안:**
1. `src/lib/remote/api-client.ts`에 `getAuthHeaders()` 유틸 함수 추가
2. 또는 `apiClient` 인스턴스의 기본 헤더에 자동으로 세션 토큰 첨부하는 인터셉터 추가
3. 모든 인증 필요 훅은 `apiClient.getWithAuth('/api/...')` 형태로 단순화

```typescript
// src/lib/remote/api-client.ts 확장
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {}
}
```

---

### [Smell-05] 함수 길이 초과 - 서비스 레이어

**긴급도: 7 / 복잡도: 5 / 테스트: 가능**

**문제:**
- `getLearnerDashboard`: 140줄 — 5개의 독립적인 Supabase 쿼리 혼합
- `enrollCourse`: 64줄 — 신규 수강/재수강 분기 + DB 조작 혼합
- `listCourses`: 75줄 — 필터/정렬/페이지네이션 쿼리 빌드

**조치 방안:**
1. `getLearnerDashboard` → 5개 private 함수로 분리:
   - `fetchEnrolledCourses(supabase, learnerId)`
   - `fetchAssignmentProgress(supabase, courseIds)`
   - `fetchUpcomingAssignments(supabase, learnerId)`
   - `fetchRecentFeedbacks(supabase, learnerId)`
   - `buildDashboardResponse(courses, progress, assignments, feedbacks)`

2. `enrollCourse` → `checkExistingEnrollment` + `createOrRestoreEnrollment` 분리

3. `listCourses` → `buildCourseQuery(supabase, filters)` 쿼리 빌더 분리

---

### [Smell-06] 테스트 불가 비즈니스 로직

**긴급도: 7 / 복잡도: 6 / 테스트: 조치 후 가능**

**문제:**
`enrollCourse` 함수 내 신규 수강 vs 재수강 판단 로직이 Supabase 쿼리와 강하게 결합:
```typescript
// DB 쿼리 + 비즈니스 로직이 한 함수에 혼합
const existing = await supabase.from('enrollments').select(...)
if (existing.data) {
  if (existing.data.status === 'active') throw Error(...)  // 비즈니스 규칙
  await supabase.from('enrollments').update(...)           // DB 조작
} else {
  await supabase.from('enrollments').insert(...)           // DB 조작
}
```

**조치 방안:**
1. 비즈니스 규칙을 순수 함수로 추출:
   ```typescript
   // src/features/enrollments/lib/enrollment-rules.ts
   export function determineEnrollmentAction(
     existing: EnrollmentRow | null
   ): 'create' | 'restore' | 'reject' {
     if (!existing) return 'create'
     if (existing.status === 'active') return 'reject'
     return 'restore'
   }
   ```
2. 서비스 함수는 규칙 결과를 받아 DB 조작만 담당
3. 순수 함수는 Supabase 없이 단위 테스트 가능

---

### [Smell-07] 타입 안전성 부재 (as unknown as)

**긴급도: 7 / 복잡도: 5 / 테스트: 가능**

**문제:**
```typescript
// dashboard/service.ts
const rows = data as unknown as FeedbackRow[]
// courses/service.ts
const courses = data as unknown as CourseRow[]
```

Supabase의 중첩 조인 쿼리는 타입 추론이 어려워 강제 캐스팅을 사용 중.

**조치 방안:**
1. `supabase-js` v2의 `Database` 타입 제너릭을 활용한 Typed Query 패턴 적용
2. `src/types/supabase.ts`에 Database 타입 정의 추가 (supabase gen types 활용)
3. 중첩 조인 결과는 `satisfies` 연산자 또는 `Awaited<ReturnType<...>>` 패턴으로 타입 추출

```bash
# supabase CLI로 타입 자동 생성
npx supabase gen types typescript --local > src/types/database.types.ts
```

---

### [Smell-08] DRY 위반 - Bearer 토큰 추출 중복

**긴급도: 6 / 복잡도: 2 / 테스트: 가능**

**문제:**
```typescript
// 여러 라우트에서 반복
const authHeader = c.req.header('Authorization')
const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
```

**조치 방안:**
1. `src/backend/middleware/auth.ts`의 `withAuth()`에서 토큰 추출 로직 중앙화
2. `c.set('accessToken', token)`으로 후속 핸들러에 전달

---

### [Smell-09] DRY 위반 - 에러 로깅 패턴 중복

**긴급도: 6 / 복잡도: 3 / 테스트: 가능**

**문제:**
```typescript
// 4곳 이상에서 동일 패턴 반복
if (!result.ok) {
  logger.error('Failed to fetch X', { error: result.error })
  return c.json(failure(result.error), 500)
}
```

**조치 방안:**
1. `src/backend/http/response.ts`에 `handleServiceResult()` 헬퍼 추가:
   ```typescript
   export function handleServiceResult<T>(
     c: Context,
     result: Result<T>,
     successStatus = 200
   ) {
     if (!result.ok) {
       c.get('logger').error('Service error', { error: result.error })
       return respond(c, failure(result.error, result.code), result.status ?? 500)
     }
     return respond(c, success(result.data), successStatus)
   }
   ```

---

### [Smell-10] 함수 길이 초과 - 컴포넌트

**긴급도: 6 / 복잡도: 4 / 테스트: 가능**

**문제:**
- `SignupPage`: 289줄 — 폼 로직 + 역할 선택 + API 호출 + 리다이렉트 혼합
- `app/page.tsx`: 309줄 — 4개 서브컴포넌트가 한 파일에 혼합
- `OnboardingForm`: 166줄 — 다단계 폼 + Supabase 직접 호출

**조치 방안:**
1. `SignupPage` → `SignupForm`, `RoleSelector`, `useSignupMutation` 분리
2. `app/page.tsx` → `HeroSection`, `CourseListSection`, `FilterSection` 파일 분리
3. `OnboardingForm` → Smell-01 조치와 병행하여 Supabase 의존성 제거 후 단계별 컴포넌트 분리

---

### [Smell-11] DRY 위반 - UUID 정규식 중복

**긴급도: 5 / 복잡도: 2 / 테스트: 가능**

**문제:**
```typescript
// courses/route.ts, enrollments/route.ts에 동일 정규식 중복
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-...-[0-9a-f]{12}$/i
```

**조치 방안:**
1. `src/constants/validation.ts` 생성:
   ```typescript
   export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
   ```
2. 또는 `zod`의 `z.string().uuid()` 스키마를 라우트 파라미터 검증에 활용

---

### [Smell-12] DRY 위반 - Supabase 조인 쿼리 중복

**긴급도: 5 / 복잡도: 4 / 테스트: 가능**

**문제:**
```typescript
// courses/service.ts와 dashboard/service.ts에서 거의 동일한 쿼리 중복
supabase.from('courses')
  .select(`id, title, description, thumbnail_url,
           category:categories!category_id(name),
           difficulty:difficulties!difficulty_id(name),
           instructor:profiles!instructor_id(display_name)`)
```

**조치 방안:**
1. `src/features/courses/backend/queries.ts` 공통 쿼리 모듈 생성
2. `COURSE_SELECT_FRAGMENT` 상수로 SELECT 필드 정의
3. `buildCourseBaseQuery(supabase)` 빌더 함수로 공통화

---

### [Smell-13] Magic String/Number

**긴급도: 5 / 복잡도: 2 / 테스트: 가능**

**문제:**
```typescript
// PostgreSQL 에러 코드 하드코딩
if (error.code === '23505') { ... }

// 의미 불명의 매직 넘버
const TOAST_REMOVE_DELAY = 1000000
```

**조치 방안:**
1. `src/constants/postgres-error-codes.ts` 생성:
   ```typescript
   export const PG_ERROR_CODES = {
     UNIQUE_VIOLATION: '23505',
     FOREIGN_KEY_VIOLATION: '23503',
   } as const
   ```
2. `TOAST_REMOVE_DELAY`에 설명 주석 또는 상수명 개선

---

### [Smell-14] 에러 메시지 서버/클라이언트 동기화 부재

**긴급도: 4 / 복잡도: 3 / 테스트: 가능**

**문제:**
서버 `error.ts`의 에러 코드와 클라이언트 컴포넌트의 한국어 메시지가 별개로 관리:
```typescript
// backend/error.ts
export const enrollmentErrorCodes = { alreadyEnrolled: 'ALREADY_ENROLLED' }

// 컴포넌트에서 하드코딩
if (error.code === 'ALREADY_ENROLLED') toast('이미 수강 중인 코스입니다')
```

**조치 방안:**
1. `src/features/[feature]/lib/error-messages.ts`에 에러 코드 → 메시지 맵 생성
2. 서버와 클라이언트가 동일 파일의 에러 코드를 참조
3. `ts-pattern`의 `match(errorCode).with(...)` 패턴으로 타입 안전 메시지 변환

---

### [Smell-15] 환경 변수 검증 중복

**긴급도: 4 / 복잡도: 3 / 테스트: 가능**

**문제:**
```
src/lib/env.ts                — 클라이언트 측 환경 변수 검증 (NEXT_PUBLIC_*)
src/backend/config/index.ts   — 서버 측 환경 변수 검증 (동일 변수 일부 포함)
```

**조치 방안:**
1. `src/lib/env.ts`를 단일 진실의 원천으로 통합 (클라이언트/서버 분리 섹션)
2. `backend/config/index.ts`는 `env.ts`를 import하여 재사용
3. 클라이언트용은 `z.string()`, 서버용은 `.min(1)` 추가 검증

---

## 3. 즉시 실행 가능한 개선 계획 (로드맵)

> **원칙:** 높은 긴급도 + 낮은 복잡도 항목을 먼저 처리하여 빠른 효과를 얻는다.

### Phase 1 — 빠른 승리 (1-2일, 복잡도 ≤ 3)

| 순서 | 작업 | Smell | 예상 효과 |
|:----:|------|-------|-----------|
| 1 | `getAuthHeaders()` 공통 유틸 추출 | Smell-04 | 3개 훅 단순화 |
| 2 | UUID_REGEX 상수 → `constants/validation.ts` | Smell-11 | 중복 제거 |
| 3 | PG_ERROR_CODES 상수 파일 생성 | Smell-13 | 매직 스트링 제거 |
| 4 | Bearer 토큰 추출 → `withAuth()` 중앙화 | Smell-08 | 미들웨어 일관성 |
| 5 | `handleServiceResult()` 헬퍼 추가 | Smell-09 | 에러 로깅 통일 |
| 6 | 에러 메시지 맵 파일 생성 | Smell-14 | 메시지 동기화 |

### Phase 2 — 구조적 개선 (3-5일, 복잡도 4-5)

| 순서 | 작업 | Smell | 예상 효과 |
|:----:|------|-------|-----------|
| 7 | `Result<T>` 타입 도입 + 에러 패턴 통일 | Smell-02 | 에러 처리 일관성 |
| 8 | 라우터 핸들러 분리 (`validateBody` 미들웨어) | Smell-03 | SRP 준수 |
| 9 | 서비스 함수 분해 (getLearnerDashboard 등) | Smell-05 | 가독성/테스트성 향상 |
| 10 | 비즈니스 규칙 순수 함수 추출 (enrollCourse) | Smell-06 | 단위 테스트 가능 |
| 11 | 컴포넌트 파일 분리 (SignupPage, app/page.tsx) | Smell-10 | 가독성/유지보수성 향상 |
| 12 | Supabase 쿼리 공통 모듈 (`courses/queries.ts`) | Smell-12 | 쿼리 재사용 |
| 13 | 환경 변수 검증 단일화 | Smell-15 | 설정 일관성 |

### Phase 3 — 심층 개선 (5-10일, 복잡도 5-6)

| 순서 | 작업 | Smell | 예상 효과 |
|:----:|------|-------|-----------|
| 14 | 레이어 경계 정리 (Supabase 직접 호출 제거) | Smell-01 | 아키텍처 일관성, 테스트 가능 |
| 15 | Supabase Database 타입 생성 + as unknown as 제거 | Smell-07 | 타입 안전성 확보 |

---

## 4. 참고: 조치 우선순위 결정 기준

```
우선순위 점수 = (긴급도 × 2) - 복잡도
```

| Smell | 긴급도 | 복잡도 | 우선순위 점수 |
|-------|:------:|:------:|:-------------:|
| Smell-04 (인증 헤더 중복) | 8 | 2 | **14** |
| Smell-08 (Bearer 토큰 중복) | 6 | 2 | **10** |
| Smell-11 (UUID 정규식) | 5 | 2 | **8** |
| Smell-13 (Magic String) | 5 | 2 | **8** |
| Smell-09 (에러 로깅 중복) | 6 | 3 | **9** |
| Smell-02 (에러 패턴 불일치) | 8 | 4 | **12** |
| Smell-03 (SRP 라우터) | 8 | 5 | **11** |
| Smell-01 (레이어 경계 위반) | 9 | 5 | **13** |
| Smell-06 (테스트 불가 로직) | 7 | 6 | **8** |
| Smell-07 (타입 안전성) | 7 | 5 | **9** |

---

*이 문서는 코드베이스 탐색 결과를 기반으로 작성되었으며, 각 Phase 완료 후 재점검을 권장합니다.*

# Database Design

> 기반 문서: `prd.md`, `workflow.md`
> 유저플로우에 명시적으로 포함된 데이터만 포함한다.
> DBMS: PostgreSQL (via Supabase)

---

## 1. 데이터 플로우 (Database 관점)

```
[1. 온보딩]
  Supabase auth.users (INSERT)
    → profiles     (INSERT: name, phone, role)
    → terms_agreements (INSERT: user_id, agreed_at)

[2. 코스 탐색]
  courses (READ: status = 'published')
    ← categories  JOIN (카테고리 필터)
    ← difficulties JOIN (난이도 필터)

[3. 수강신청 / 수강취소]
  courses     (READ: status 검증)
    → enrollments (UPSERT: ON CONFLICT(course_id, learner_id)
                    기록 없음          → INSERT
                    cancelled_at IS NOT NULL → UPDATE SET cancelled_at = NULL, enrolled_at = NOW()
                    cancelled_at IS NULL     → 에러 (이미 수강 중))  ← 신청/재신청
    → enrollments (UPDATE: cancelled_at = NOW())                    ← 취소

[4. Learner 대시보드]
  enrollments (WHERE cancelled_at IS NULL)
    → courses     (내 코스 목록)
    → assignments (마감 임박, ORDER BY due_at ASC)
    → submissions (최근 피드백, WHERE status = 'graded')
  COMPUTE 진행률:
    - 분자: COUNT(submissions WHERE status != 'resubmission_required')
    - 분모: COUNT(assignments WHERE status = 'published' AND course_id = ?)

[5. 과제 열람]
  enrollments (READ: 수강 여부 검증)
  assignments (READ: status = 'published')

[6. 과제 제출 / 재제출]
  assignments (READ: due_at, allow_late, allow_resubmit, status 검증)
    → submissions (INSERT: content_text, content_link, is_late, status = 'submitted')
    → submissions (UPDATE: content 갱신, status = 'submitted')  ← 재제출

[7. 성적 & 피드백]
  submissions JOIN assignments (READ: WHERE learner_id = ?)
  COMPUTE 현재 평점 (채점된 과제 기준, 퀄리티 지표):
    - 분자: SUM(score × weight) WHERE status = 'graded'
    - 분모: SUM(weight)         WHERE status = 'graded'
    - ※ 미제출/미채점 과제 집계 제외. "지금까지 제출한 것들의 평균 점수"
  COMPUTE 예상 최종 성적 (전체 과제 기준, 달성도 지표):
    - 분자: SUM(score × weight) WHERE status = 'graded'
    - 분모: SUM(weight)         WHERE course_id = ? AND status = 'published' (코스 총 비중)
    - ※ 미제출 과제는 0점 처리. weight 합계 비정규화 시 총 비중으로 나눔
    - ※ UI에 두 값을 함께 표시하여 학습자가 실제 성취도를 오해하지 않도록 함

[8. Instructor 대시보드]
  courses     (READ: WHERE instructor_id = ?)
  submissions (READ: COUNT WHERE status = 'submitted')           ← 채점 대기 수
  submissions (READ: ORDER BY submitted_at DESC)                 ← 최근 제출물

[9. 코스 / 과제 관리]
  courses     (INSERT / UPDATE / status 전환: draft → published → archived)
  assignments (INSERT / UPDATE / status 전환: draft → published → closed)

[10. 채점]
  submissions (UPDATE: score, feedback, status = 'graded',            graded_at = NOW())
  submissions (UPDATE: feedback,          status = 'resubmission_required')

[11. 운영]
  reports      (INSERT: reporter_id, target_type, target_id, reason, content)
  reports      (UPDATE: status, action)
  categories   (INSERT / UPDATE: is_active)
  difficulties (INSERT / UPDATE: is_active)
```

---

## 2. ERD (개요)

```
auth.users (Supabase)
  └─ profiles (1:1)
       └─ terms_agreements (1:N)
       └─ courses [instructor] (1:N)
            └─ assignments (1:N)
                 └─ submissions (1:N) ←─ profiles [learner]
       └─ enrollments (N:M) ── courses
       └─ reports [reporter] (1:N)

categories  ──< courses
difficulties ──< courses
```

---

## 3. 데이터베이스 스키마

### 3.1 ENUM 타입

```sql
CREATE TYPE user_role AS ENUM ('learner', 'instructor', 'operator');

CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');

CREATE TYPE submission_status AS ENUM (
  'submitted',
  'graded',
  'resubmission_required',
  'invalidated'  -- 신고 처리로 인한 무효화 (admin_memo 컬럼으로 사유 추적)
);

CREATE TYPE report_target_type AS ENUM (
  'course',
  'assignment',
  'submission',
  'user'
);

CREATE TYPE report_status AS ENUM ('received', 'investigating', 'resolved');

CREATE TYPE report_action AS ENUM (
  'warning',
  'invalidate_submission',
  'restrict_account'
);
```

---

### 3.2 테이블

#### `profiles`

Supabase `auth.users` 와 1:1 매핑. 역할 및 최소 프로필 저장.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK, FK auth.users | Supabase Auth UID |
| name | TEXT | NOT NULL | 이름 |
| phone | TEXT | NULL 허용 | 휴대폰번호 (선택 수집, 마이페이지에서 등록) |
| role | user_role | NOT NULL | learner \| instructor \| operator |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID      PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT      NOT NULL,
  phone      TEXT,
  role       user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### `terms_agreements`

온보딩 시 약관 동의 이력.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | NOT NULL, FK profiles | |
| agreed_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 동의 시각 |

```sql
CREATE TABLE IF NOT EXISTS terms_agreements (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### `categories`

코스 카테고리 메타데이터. **Seed 데이터로 고정 관리** (운영자 UI 미구현. 변경 필요 시 마이그레이션으로 처리).

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| name | TEXT | NOT NULL, UNIQUE | 카테고리명 |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | 비활성화 시 신규 코스 선택 불가 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE TABLE IF NOT EXISTS categories (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT    NOT NULL UNIQUE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### `difficulties`

코스 난이도 메타데이터. **Seed 데이터로 고정 관리** (운영자 UI 미구현. 변경 필요 시 마이그레이션으로 처리).

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| name | TEXT | NOT NULL, UNIQUE | 난이도명 (예: 입문, 초급, 중급) |
| is_active | BOOLEAN | NOT NULL DEFAULT TRUE | 비활성화 시 신규 코스 선택 불가 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE TABLE IF NOT EXISTS difficulties (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT    NOT NULL UNIQUE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

#### `courses`

강사가 개설하는 코스.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| instructor_id | UUID | NOT NULL, FK profiles | 소유 강사 |
| title | TEXT | NOT NULL | 코스 제목 |
| description | TEXT | | 코스 소개 |
| category_id | UUID | FK categories, NULL 허용 | |
| difficulty_id | UUID | FK difficulties, NULL 허용 | |
| curriculum | TEXT | | 커리큘럼 (텍스트) |
| status | course_status | NOT NULL DEFAULT 'draft' | draft \| published \| archived |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE TABLE IF NOT EXISTS courses (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID         NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  title         TEXT         NOT NULL,
  description   TEXT,
  category_id   UUID         REFERENCES categories(id) ON DELETE SET NULL,
  difficulty_id UUID         REFERENCES difficulties(id) ON DELETE SET NULL,
  curriculum    TEXT,
  status        course_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status        ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category_id   ON courses(category_id);
```

---

#### `enrollments`

학습자의 코스 수강신청 기록.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| course_id | UUID | NOT NULL, FK courses | |
| learner_id | UUID | NOT NULL, FK profiles | |
| enrolled_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 신청 시각 |
| cancelled_at | TIMESTAMPTZ | NULL 허용 | 취소 시각, NULL = 활성 수강 |

- `(course_id, learner_id)` UNIQUE → 중복 신청 방지 및 UPSERT(ON CONFLICT) 지원에 필수
- `cancelled_at IS NULL` 조건으로 활성 수강 여부 판별
- 재신청 시 새 row INSERT 없이 기존 row UPDATE → 중복 데이터 생성 방지
- **재수강 정책: 이어하기** → 재신청 후 기존 `submissions` 데이터 유지. 과거 제출/채점 이력이 그대로 보존됨. (초기화 불필요, UX 단순화)

```sql
CREATE TABLE IF NOT EXISTS enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  learner_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  -- UPSERT 쿼리(ON CONFLICT)를 지원하기 위해 아래 복합 유니크 키 필수
  UNIQUE(course_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_learner_id ON enrollments(learner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id  ON enrollments(course_id);
```

---

#### `assignments`

코스에 속하는 과제.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| course_id | UUID | NOT NULL, FK courses | |
| title | TEXT | NOT NULL | 과제 제목 |
| description | TEXT | | 과제 설명 및 요구사항 |
| due_at | TIMESTAMPTZ | NOT NULL | 마감일 |
| weight | NUMERIC(5,2) | NOT NULL, CHECK > 0 | 점수 비중. **코스 내 전체 과제 weight 합계는 BE 성적 계산 시 정규화(normalize)하여 처리** (DB 레벨 합계 제약 없음, FE 생성 폼에서 합계 경고 표시 권장) |
| allow_late | BOOLEAN | NOT NULL DEFAULT FALSE | 지각 제출 허용 여부 |
| allow_resubmit | BOOLEAN | NOT NULL DEFAULT FALSE | 재제출 허용 여부 |
| status | assignment_status | NOT NULL DEFAULT 'draft' | draft \| published \| closed. ※ closed는 강사 수동 강제 마감 전용. 일반 마감은 `status='published' AND NOW() > due_at` 으로 판별 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE TABLE IF NOT EXISTS assignments (
  id             UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      UUID              NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title          TEXT              NOT NULL,
  description    TEXT,
  due_at         TIMESTAMPTZ       NOT NULL,
  weight         NUMERIC(5,2)      NOT NULL CHECK (weight > 0),
  allow_late     BOOLEAN           NOT NULL DEFAULT FALSE,
  allow_resubmit BOOLEAN           NOT NULL DEFAULT FALSE,
  -- 'closed'는 강사가 수동으로 조기 종료했을 때만 사용.
  -- 일반적인 마감은 (status='published' AND due_at < NOW()) 로 판단함.
  status         assignment_status NOT NULL DEFAULT 'draft', -- draft | published | closed
  created_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status    ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_at    ON assignments(due_at);
```

---

#### `submissions`

학습자의 과제 제출물.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| assignment_id | UUID | NOT NULL, FK assignments | |
| learner_id | UUID | NOT NULL, FK profiles | |
| content_text | TEXT | NULL 허용 | 제출 텍스트 (content_link 없을 시 필수) |
| content_link | TEXT | NULL 허용 | 제출 링크 (content_text 없을 시 필수, URL) |
| is_late | BOOLEAN | NOT NULL DEFAULT FALSE | 지각 제출 여부 |
| status | submission_status | NOT NULL DEFAULT 'submitted' | submitted \| graded \| resubmission_required \| invalidated |
| score | INTEGER | NULL 허용, CHECK 0~100 | 채점 점수 |
| feedback | TEXT | NULL 허용 | 강사 피드백 |
| submitted_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | 최종 제출 시각 |
| graded_at | TIMESTAMPTZ | NULL 허용 | 채점 시각 |
| admin_memo | TEXT | NULL 허용 | 무효화(invalidated) 처리 시 운영자 사유 기록 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

- `(assignment_id, learner_id)` UNIQUE → 과제당 1건, 재제출은 UPDATE
- 재제출 시: `content_text`, `content_link`, `is_late`, `status`, `submitted_at` 갱신

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id            UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID              NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  learner_id    UUID              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_text  TEXT,
  content_link  TEXT,
  -- content_text, content_link 중 하나 이상 필수
  CONSTRAINT chk_submission_content CHECK (content_text IS NOT NULL OR content_link IS NOT NULL),
  is_late       BOOLEAN           NOT NULL DEFAULT FALSE,
  status        submission_status NOT NULL DEFAULT 'submitted',
  score         INTEGER           CHECK (score >= 0 AND score <= 100),
  feedback      TEXT,
  submitted_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  graded_at     TIMESTAMPTZ,
  admin_memo    TEXT,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, learner_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_learner_id    ON submissions(learner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status        ON submissions(status);
```

---

#### `reports`

신고 접수 이력. **프론트엔드 어드민 UI 미구현** (MVP 범위 외). 신고 접수 시 이메일/Slack 알림 발송 후 운영자가 DB 직접 쿼리로 처리.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | UUID | PK | |
| reporter_id | UUID | NOT NULL, FK profiles | 신고자 |
| target_type | report_target_type | NOT NULL | course \| assignment \| submission \| user |
| target_id | UUID | NOT NULL | 신고 대상 레코드 ID |
| reason | TEXT | NOT NULL | 신고 사유 |
| content | TEXT | NOT NULL | 신고 내용 |
| status | report_status | NOT NULL DEFAULT 'received' | received \| investigating \| resolved |
| action | report_action | NULL 허용 | 처리 액션 (경고/무효화/계정제한) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | |

```sql
CREATE TABLE IF NOT EXISTS reports (
  id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID               NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  target_type report_target_type NOT NULL,
  target_id   UUID               NOT NULL,
  reason      TEXT               NOT NULL,
  content     TEXT               NOT NULL,
  status      report_status      NOT NULL DEFAULT 'received',
  action      report_action,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
```

---

## 4. updated_at 자동 갱신 트리거

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_difficulties_updated_at
  BEFORE UPDATE ON difficulties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 5. 테이블 요약

| 테이블 | 역할 |
|---|---|
| `profiles` | 유저 역할 및 최소 프로필 |
| `terms_agreements` | 온보딩 약관 동의 이력 |
| `categories` | 코스 카테고리 메타데이터 (Seed 고정, UI 미구현) |
| `difficulties` | 코스 난이도 메타데이터 (Seed 고정, UI 미구현) |
| `courses` | 강사 개설 코스 |
| `enrollments` | 학습자 수강신청 기록 |
| `assignments` | 코스별 과제 |
| `submissions` | 학습자 제출물 및 채점 결과 |
| `reports` | 신고 접수 이력 (어드민 UI 없음, DB 직접 처리) |

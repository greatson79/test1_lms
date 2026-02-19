-- Migration: LMS core tables
-- Based on: docs/database.md
-- Tables: profiles, terms_agreements, categories, difficulties,
--         courses, enrollments, assignments, submissions, reports

-- ============================================================
-- 0. Extension
-- ============================================================
create extension if not exists "pgcrypto";


-- ============================================================
-- 1. ENUM Types (idempotent via DO / EXCEPTION)
-- ============================================================

do $$ begin
  create type public.user_role as enum ('learner', 'instructor', 'operator');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.course_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  -- 'closed' = 강사 수동 강제 마감 전용.
  -- 일반 마감은 (status='published' AND due_at < NOW()) 로 판단.
  create type public.assignment_status as enum ('draft', 'published', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.submission_status as enum (
    'submitted',
    'graded',
    'resubmission_required'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_target_type as enum (
    'course',
    'assignment',
    'submission',
    'user'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum ('received', 'investigating', 'resolved');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_action as enum (
    'warning',
    'invalidate_submission',
    'restrict_account'
  );
exception when duplicate_object then null;
end $$;


-- ============================================================
-- 2. Tables (FK 의존성 순서대로 생성)
-- ============================================================

-- ------------------------------------------------------------
-- 2-1. profiles
--   Supabase auth.users 와 1:1 매핑. 역할 및 최소 프로필 저장.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid                    primary key references auth.users(id) on delete cascade,
  name       text                    not null,
  phone      text                    not null,
  role       public.user_role        not null,
  created_at timestamptz             not null default now(),
  updated_at timestamptz             not null default now()
);

alter table if exists public.profiles disable row level security;


-- ------------------------------------------------------------
-- 2-2. terms_agreements
--   온보딩 시 약관 동의 이력.
-- ------------------------------------------------------------
create table if not exists public.terms_agreements (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  agreed_at  timestamptz not null default now()
);

alter table if exists public.terms_agreements disable row level security;


-- ------------------------------------------------------------
-- 2-3. categories
--   코스 카테고리 메타데이터. 운영자가 CRUD 관리.
-- ------------------------------------------------------------
create table if not exists public.categories (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.categories disable row level security;


-- ------------------------------------------------------------
-- 2-4. difficulties
--   코스 난이도 메타데이터. 운영자가 CRUD 관리.
-- ------------------------------------------------------------
create table if not exists public.difficulties (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null unique,
  is_active  boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.difficulties disable row level security;


-- ------------------------------------------------------------
-- 2-5. courses
--   강사가 개설하는 코스.
-- ------------------------------------------------------------
create table if not exists public.courses (
  id            uuid                 primary key default gen_random_uuid(),
  instructor_id uuid                 not null references public.profiles(id) on delete restrict,
  title         text                 not null,
  description   text,
  category_id   uuid                 references public.categories(id) on delete set null,
  difficulty_id uuid                 references public.difficulties(id) on delete set null,
  curriculum    text,
  status        public.course_status not null default 'draft',
  created_at    timestamptz          not null default now(),
  updated_at    timestamptz          not null default now()
);

alter table if exists public.courses disable row level security;

create index if not exists idx_courses_instructor_id on public.courses(instructor_id);
create index if not exists idx_courses_status        on public.courses(status);
create index if not exists idx_courses_category_id   on public.courses(category_id);


-- ------------------------------------------------------------
-- 2-6. enrollments
--   학습자의 코스 수강신청 기록.
--   UNIQUE(course_id, learner_id): UPSERT(ON CONFLICT) 지원에 필수.
--   재신청 시 새 row INSERT 없이 UPDATE → 중복 데이터 생성 방지.
--   cancelled_at IS NULL = 활성 수강 / IS NOT NULL = 취소 상태.
-- ------------------------------------------------------------
create table if not exists public.enrollments (
  id           uuid        primary key default gen_random_uuid(),
  course_id    uuid        not null references public.courses(id) on delete cascade,
  learner_id   uuid        not null references public.profiles(id) on delete cascade,
  enrolled_at  timestamptz not null default now(),
  cancelled_at timestamptz,
  -- UPSERT 쿼리(ON CONFLICT)를 지원하기 위해 복합 유니크 키 필수
  unique(course_id, learner_id)
);

alter table if exists public.enrollments disable row level security;

create index if not exists idx_enrollments_learner_id on public.enrollments(learner_id);
create index if not exists idx_enrollments_course_id  on public.enrollments(course_id);


-- ------------------------------------------------------------
-- 2-7. assignments
--   코스에 속하는 과제.
--   status 'closed' = 강사 수동 강제 마감 전용.
--   일반 마감 판단: status='published' AND due_at < NOW().
-- ------------------------------------------------------------
create table if not exists public.assignments (
  id             uuid                    primary key default gen_random_uuid(),
  course_id      uuid                    not null references public.courses(id) on delete cascade,
  title          text                    not null,
  description    text,
  due_at         timestamptz             not null,
  weight         numeric(5, 2)           not null check (weight > 0),
  allow_late     boolean                 not null default false,
  allow_resubmit boolean                 not null default false,
  status         public.assignment_status not null default 'draft',
  created_at     timestamptz             not null default now(),
  updated_at     timestamptz             not null default now()
);

alter table if exists public.assignments disable row level security;

create index if not exists idx_assignments_course_id on public.assignments(course_id);
create index if not exists idx_assignments_status    on public.assignments(status);
create index if not exists idx_assignments_due_at    on public.assignments(due_at);


-- ------------------------------------------------------------
-- 2-8. submissions
--   학습자의 과제 제출물 및 채점 결과.
--   UNIQUE(assignment_id, learner_id): 과제당 1건, 재제출은 UPDATE.
--   재제출 시 갱신 컬럼: content_text, content_link, is_late, status, submitted_at.
-- ------------------------------------------------------------
create table if not exists public.submissions (
  id            uuid                    primary key default gen_random_uuid(),
  assignment_id uuid                    not null references public.assignments(id) on delete cascade,
  learner_id    uuid                    not null references public.profiles(id) on delete cascade,
  content_text  text                    not null,
  content_link  text,
  is_late       boolean                 not null default false,
  status        public.submission_status not null default 'submitted',
  score         integer                 check (score >= 0 and score <= 100),
  feedback      text,
  submitted_at  timestamptz             not null default now(),
  graded_at     timestamptz,
  created_at    timestamptz             not null default now(),
  updated_at    timestamptz             not null default now(),
  unique(assignment_id, learner_id)
);

alter table if exists public.submissions disable row level security;

create index if not exists idx_submissions_assignment_id on public.submissions(assignment_id);
create index if not exists idx_submissions_learner_id    on public.submissions(learner_id);
create index if not exists idx_submissions_status        on public.submissions(status);


-- ------------------------------------------------------------
-- 2-9. reports
--   운영자 신고 접수 및 처리 이력.
--   target_id는 target_type에 따라 각 테이블의 PK를 참조 (polymorphic).
-- ------------------------------------------------------------
create table if not exists public.reports (
  id          uuid                      primary key default gen_random_uuid(),
  reporter_id uuid                      not null references public.profiles(id) on delete restrict,
  target_type public.report_target_type not null,
  target_id   uuid                      not null,
  reason      text                      not null,
  content     text                      not null,
  status      public.report_status      not null default 'received',
  action      public.report_action,
  created_at  timestamptz               not null default now(),
  updated_at  timestamptz               not null default now()
);

alter table if exists public.reports disable row level security;

create index if not exists idx_reports_status on public.reports(status);


-- ============================================================
-- 3. updated_at 자동 갱신 트리거
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- profiles
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- categories
drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- difficulties
drop trigger if exists trg_difficulties_updated_at on public.difficulties;
create trigger trg_difficulties_updated_at
  before update on public.difficulties
  for each row execute function public.set_updated_at();

-- courses
drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- assignments
drop trigger if exists trg_assignments_updated_at on public.assignments;
create trigger trg_assignments_updated_at
  before update on public.assignments
  for each row execute function public.set_updated_at();

-- submissions
drop trigger if exists trg_submissions_updated_at on public.submissions;
create trigger trg_submissions_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

-- reports
drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

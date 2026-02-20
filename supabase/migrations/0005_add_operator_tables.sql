-- Migration: operator 기능 지원을 위한 DB 변경
-- 1. submission_status ENUM에 invalidated 추가
-- 2. profiles.is_active 컬럼 추가
-- 3. warnings 테이블 신규 생성

-- ============================================================
-- 1. submission_status ENUM에 'invalidated' 값 추가
-- ============================================================
-- ADD VALUE IF NOT EXISTS: 이미 존재하면 오류 없이 무시 (멱등 적용 가능)
ALTER TYPE public.submission_status ADD VALUE IF NOT EXISTS 'invalidated';


-- ============================================================
-- 2. profiles.is_active 컬럼 추가
-- ============================================================
-- DEFAULT true: 기존 모든 프로필 레코드가 활성 상태를 유지
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;


-- ============================================================
-- 3. warnings 테이블 신규 생성
-- ============================================================
CREATE TABLE IF NOT EXISTS public.warnings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_id  uuid        NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  warned_at  timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS public.warnings DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_warnings_user_id   ON public.warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_report_id ON public.warnings(report_id);

DROP TRIGGER IF EXISTS trg_warnings_updated_at ON public.warnings;
CREATE TRIGGER trg_warnings_updated_at
  BEFORE UPDATE ON public.warnings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migration: terms_agreements 테이블에 updated_at 컬럼 추가
-- guideline: Add updated_at column to all tables, and use trigger to update it

begin;

-- updated_at 컬럼 추가 (이미 존재하면 무시)
do $$ begin
  alter table public.terms_agreements
    add column updated_at timestamptz not null default now();
exception when duplicate_column then null;
end $$;

-- updated_at 자동 갱신 트리거 함수 (이미 존재하면 교체)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- terms_agreements 트리거 (이미 존재하면 무시)
do $$ begin
  create trigger trg_terms_agreements_updated_at
    before update on public.terms_agreements
    for each row execute function public.set_updated_at();
exception when duplicate_object then null;
end $$;

commit;

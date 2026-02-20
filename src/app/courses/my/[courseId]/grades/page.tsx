'use client';

import Link from 'next/link';
import { use } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useCourseGradesQuery } from '@/features/dashboard/hooks/useCourseGradesQuery';
import { GradesView } from '@/features/dashboard/components/grades-view';

type GradesPageProps = {
  params: Promise<{ courseId: string }>;
};

const GradesSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
    </div>
    <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
  </div>
);

export default function GradesPage({ params }: GradesPageProps) {
  const { courseId } = use(params);
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('learner');
  const { data, isLoading, isError, error, refetch } = useCourseGradesQuery(courseId);

  if (isRoleLoading || !isAllowed) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-3">
        <Link
          href="/courses/my"
          className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          내 코스로 돌아가기
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {data?.courseTitle ?? '성적 조회'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">코스별 과제 성적 및 피드백</p>
        </div>
      </header>

      {isLoading ? (
        <GradesSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <p className="font-medium text-slate-700">성적 데이터를 불러오지 못했습니다.</p>
          <p className="mt-1 text-sm text-slate-400">{error?.message}</p>
          <button
            onClick={() => void refetch()}
            className="mt-6 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            다시 시도
          </button>
        </div>
      ) : data ? (
        <GradesView data={data} />
      ) : null}
    </main>
  );
}

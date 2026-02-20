'use client';

import Link from 'next/link';
import { BookOpen, RefreshCw } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useInstructorDashboardQuery } from '@/features/instructor-dashboard/hooks/useInstructorDashboardQuery';
import { PendingCountSummary } from '@/features/instructor-dashboard/components/pending-count-summary';
import { InstructorCourseCard } from '@/features/instructor-dashboard/components/instructor-course-card';
import { RecentSubmissionsSection } from '@/features/instructor-dashboard/components/recent-submissions-section';

type InstructorDashboardPageProps = {
  params: Promise<Record<string, never>>;
};

const SKELETON_COURSE_COUNT = 3;
const SKELETON_SUBMISSION_COUNT = 4;

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-8">
    <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: SKELETON_COURSE_COUNT }).map((_, i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
    <div className="flex flex-col gap-2">
      {Array.from({ length: SKELETON_SUBMISSION_COUNT }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  </div>
);

export default function InstructorDashboardPage({ params }: InstructorDashboardPageProps) {
  void params;
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('instructor');
  const { data, isLoading, isError, error, refetch } = useInstructorDashboardQuery();

  if (isRoleLoading || !isAllowed) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">강사 대시보드</h1>
        <p className="text-slate-500">코스와 과제를 관리하세요.</p>
      </header>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-24 text-center">
          <p className="font-medium text-slate-700">데이터를 불러오지 못했습니다.</p>
          <p className="mt-1 text-sm text-slate-400">{error?.message}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          <PendingCountSummary totalPendingCount={data?.totalPendingCount ?? 0} />

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">내 코스</h2>
            </div>

            {data?.courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-24 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-slate-300" />
                <p className="text-lg font-medium text-slate-700">
                  아직 개설된 코스가 없습니다.
                </p>
                <p className="mt-2 text-sm text-slate-400">코스를 개설하고 수강생을 모집해보세요.</p>
                <Link
                  href="/instructor/courses/new"
                  className="mt-6 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  코스 만들기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data?.courses.map((course) => (
                  <InstructorCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>

          <RecentSubmissionsSection submissions={data?.recentSubmissions ?? []} />
        </div>
      )}
    </div>
  );
}

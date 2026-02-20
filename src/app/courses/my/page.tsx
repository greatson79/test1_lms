'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useLearnerDashboardQuery } from '@/features/dashboard/hooks/useLearnerDashboardQuery';
import { EnrolledCourseCard } from '@/features/dashboard/components/enrolled-course-card';
import { UpcomingAssignmentsSection } from '@/features/dashboard/components/upcoming-assignments-section';
import { RecentFeedbacksSection } from '@/features/dashboard/components/recent-feedbacks-section';

type MyCoursesPageProps = {
  params: Promise<Record<string, never>>;
};

const SKELETON_COUNT = 3;

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-8">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
    </div>
  </div>
);

export default function MyCoursesPage({ params }: MyCoursesPageProps) {
  void params;
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('learner');
  const { user } = useCurrentUser();
  const { data, isLoading, isError, error, refetch } = useLearnerDashboardQuery();

  if (isRoleLoading || !isAllowed) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">내 학습 현황</h1>
        <p className="text-sm text-slate-500">
          {user?.email ?? ''} 님, 오늘도 열심히 학습해보세요!
        </p>
      </header>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <p className="font-medium text-slate-700">데이터를 불러오지 못했습니다.</p>
          <p className="mt-1 text-sm text-slate-400">{error?.message}</p>
          <button
            onClick={() => void refetch()}
            className="mt-6 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">수강 중인 코스</h2>
              <Link
                href="/courses"
                className="text-sm text-slate-500 underline hover:text-slate-700"
              >
                코스 탐색하기
              </Link>
            </div>

            {data?.courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium text-slate-700">수강 중인 코스가 없습니다.</p>
                <p className="mt-1 text-sm text-slate-400">
                  관심 있는 코스를 수강신청 해보세요.
                </p>
                <Link
                  href="/courses"
                  className="mt-5 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  코스 탐색하기
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data?.courses.map((course) => (
                  <EnrolledCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <UpcomingAssignmentsSection assignments={data?.upcomingAssignments ?? []} />
            <RecentFeedbacksSection feedbacks={data?.recentFeedbacks ?? []} />
          </div>
        </div>
      )}
    </main>
  );
}

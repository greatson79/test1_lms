'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, LayoutDashboard } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useCourseListQuery } from '@/features/courses/hooks/useCourseListQuery';
import { CourseCard } from '@/features/courses/components/course-card';
import { CourseFilter } from '@/features/courses/components/course-filter';
import type { CourseListQuery } from '@/features/courses/lib/dto';

const CourseListContent = () => {
  const searchParams = useSearchParams();

  const params: CourseListQuery = {
    search: searchParams.get('search') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
    difficultyId: searchParams.get('difficultyId') ?? undefined,
    sort: (searchParams.get('sort') as CourseListQuery['sort']) ?? 'recent',
  };

  const { data, isLoading, isError, error } = useCourseListQuery(params);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-500 mb-2">코스 목록을 불러오지 못했습니다.</p>
        <p className="text-sm text-slate-400">{error?.message}</p>
      </div>
    );
  }

  const courses = data?.courses ?? [];
  const categories = data?.meta.categories ?? [];
  const difficulties = data?.meta.difficulties ?? [];

  return (
    <>
      <CourseFilter categories={categories} difficulties={difficulties} />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">검색 결과가 없습니다.</p>
          <p className="text-sm text-slate-400 mt-1">다른 검색어나 필터를 사용해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </>
  );
};

type CoursesPageProps = {
  params: Promise<Record<string, never>>;
};

export default function CoursesPage({ params }: CoursesPageProps) {
  void params;
  const { isAllowed, isLoading } = useRoleGuard('learner');

  if (isLoading || !isAllowed) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">코스 카탈로그</h1>
          <p className="text-sm text-slate-500 mt-1">다양한 코스를 탐색하고 수강신청 하세요.</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <LayoutDashboard className="h-4 w-4" />
          내 대시보드
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-slate-100" />}>
          <CourseListContent />
        </Suspense>
      </div>
    </main>
  );
}

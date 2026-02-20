'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useInstructorCourseMetaQuery } from '@/features/instructor-courses/hooks/useInstructorCourseMetaQuery';
import { useCreateCourseMutation } from '@/features/instructor-courses/hooks/useCreateCourseMutation';
import { CourseForm } from '@/features/instructor-courses/components/course-form';
import type { CreateCourseBody } from '@/features/instructor-courses/lib/dto';

type NewCoursePageProps = {
  params: Promise<Record<string, never>>;
};

const FormSkeleton = () => (
  <div className="flex flex-col gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
        <div className="h-10 animate-pulse rounded bg-slate-100" />
      </div>
    ))}
    <div className="h-10 w-24 animate-pulse rounded bg-slate-100" />
  </div>
);

export default function NewCoursePage({ params }: NewCoursePageProps) {
  void params;
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('instructor');
  const { data: metaData, isLoading: isMetaLoading, isError: isMetaError, refetch } = useInstructorCourseMetaQuery();
  const { mutate, isPending, error } = useCreateCourseMutation();

  if (isRoleLoading || !isAllowed) return null;

  const handleSubmit = (values: CreateCourseBody) => {
    mutate(values);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Link
          href="/instructor/dashboard"
          className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          대시보드로 돌아가기
        </Link>
        <h1 className="text-3xl font-semibold">새 코스 만들기</h1>
        <p className="text-slate-500">코스 정보를 입력하고 생성하세요.</p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {isMetaLoading ? (
        <FormSkeleton />
      ) : isMetaError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-24 text-center">
          <p className="font-medium text-slate-700">폼 데이터를 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </button>
        </div>
      ) : metaData ? (
        <CourseForm
          meta={metaData.meta}
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel="코스 만들기"
        />
      ) : null}
    </div>
  );
}

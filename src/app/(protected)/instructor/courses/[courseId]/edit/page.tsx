'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useInstructorCourseQuery } from '@/features/instructor-courses/hooks/useInstructorCourseQuery';
import { useUpdateCourseMutation } from '@/features/instructor-courses/hooks/useUpdateCourseMutation';
import { CourseForm } from '@/features/instructor-courses/components/course-form';
import type { CreateCourseBody } from '@/features/instructor-courses/lib/dto';

type EditCoursePageProps = {
  params: Promise<{ courseId: string }>;
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

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const { courseId } = use(params);
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('instructor');
  const { data, isLoading, isError, error, refetch } = useInstructorCourseQuery(courseId);
  const { mutate: updateCourse, isPending, error: updateError, isSuccess } = useUpdateCourseMutation(courseId);

  if (isRoleLoading || !isAllowed) return null;

  const handleSubmit = (values: CreateCourseBody) => {
    updateCourse(values);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Link
          href={`/instructor/courses/${courseId}`}
          className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          코스 상세로 돌아가기
        </Link>
        <h1 className="text-3xl font-semibold">코스 수정</h1>
        <p className="text-slate-500">코스 정보를 수정하세요.</p>
      </header>

      {updateError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {updateError.message}
        </div>
      )}

      {isSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          코스가 성공적으로 수정되었습니다.
        </div>
      )}

      {isLoading ? (
        <FormSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-24 text-center">
          <p className="font-medium text-slate-700">코스 정보를 불러오지 못했습니다.</p>
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
      ) : data ? (
        <CourseForm
          defaultValues={{
            title: data.course.title,
            description: data.course.description,
            categoryId: data.course.category?.id ?? null,
            difficultyId: data.course.difficulty?.id ?? null,
            curriculum: data.course.curriculum,
          }}
          meta={data.meta}
          onSubmit={handleSubmit}
          isPending={isPending}
          submitLabel="수정 저장"
        />
      ) : null}
    </div>
  );
}

'use client';

import { use } from 'react';
import Link from 'next/link';
import { Pencil, ArrowLeft, RefreshCw, Plus, BookOpen } from 'lucide-react';
import { match } from 'ts-pattern';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useInstructorCourseQuery } from '@/features/instructor-courses/hooks/useInstructorCourseQuery';
import { useUpdateCourseStatusMutation } from '@/features/instructor-courses/hooks/useUpdateCourseStatusMutation';
import { CourseStatusButton } from '@/features/instructor-courses/components/course-status-button';
import { useInstructorCourseAssignmentsQuery } from '@/features/instructor-assignments/hooks/useInstructorCourseAssignmentsQuery';
import type { InstructorAssignmentDto } from '@/features/instructor-assignments/lib/dto';

type InstructorCourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

const DetailSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
    <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
    <div className="h-24 animate-pulse rounded bg-slate-100" />
    <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
    <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
  </div>
);

type StatusBadgeProps = {
  status: 'draft' | 'published' | 'archived';
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { label, variant } = match(status)
    .with('draft', () => ({ label: '초안', variant: 'secondary' as const }))
    .with('published', () => ({ label: '게시됨', variant: 'default' as const }))
    .with('archived', () => ({ label: '보관됨', variant: 'outline' as const }))
    .exhaustive();

  return <Badge variant={variant}>{label}</Badge>;
};

const AssignmentStatusBadge = ({ status }: { status: InstructorAssignmentDto['status'] }) => {
  const { label, variant } = match(status)
    .with('draft', () => ({ label: '초안', variant: 'secondary' as const }))
    .with('published', () => ({ label: '게시됨', variant: 'default' as const }))
    .with('closed', () => ({ label: '마감됨', variant: 'outline' as const }))
    .exhaustive();

  return <Badge variant={variant}>{label}</Badge>;
};

const AssignmentSkeleton = () => (
  <div className="flex flex-col gap-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-slate-100" />
    ))}
  </div>
);

export default function InstructorCourseDetailPage({ params }: InstructorCourseDetailPageProps) {
  const { courseId } = use(params);
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('instructor');
  const { data, isLoading, isError, error, refetch } = useInstructorCourseQuery(courseId);
  const { mutate: changeStatus, isPending } = useUpdateCourseStatusMutation(courseId);
  const {
    data: assignmentsData,
    isLoading: isAssignmentsLoading,
  } = useInstructorCourseAssignmentsQuery(courseId);

  if (isRoleLoading || !isAllowed) return null;

  const handlePublish = () => {
    changeStatus({ status: 'published' });
  };

  const handleArchive = () => {
    changeStatus({ status: 'archived' });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Link
          href="/instructor/dashboard"
          className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          대시보드로 돌아가기
        </Link>
        <h1 className="text-3xl font-semibold">코스 상세</h1>
      </header>

      {isLoading ? (
        <DetailSkeleton />
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
        <div className="flex flex-col gap-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">{data.course.title}</h2>
                <StatusBadge status={data.course.status} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CourseStatusButton
                status={data.course.status}
                onPublish={handlePublish}
                onArchive={handleArchive}
                isPending={isPending}
              />
              <Button variant="outline" asChild>
                <Link href={`/instructor/courses/${courseId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  수정
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6">
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-slate-500">설명</h3>
              {data.course.description ? (
                <p className="whitespace-pre-wrap text-slate-700">{data.course.description}</p>
              ) : (
                <p className="text-slate-400">설명이 없습니다.</p>
              )}
            </section>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
              <section className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-slate-500">카테고리</h3>
                <p className="text-slate-700">{data.course.category?.name ?? '없음'}</p>
              </section>

              <section className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-slate-500">난이도</h3>
                <p className="text-slate-700">{data.course.difficulty?.name ?? '없음'}</p>
              </section>
            </div>

            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-slate-500">커리큘럼</h3>
              {data.course.curriculum ? (
                <p className="whitespace-pre-wrap text-slate-700">{data.course.curriculum}</p>
              ) : (
                <p className="text-slate-400">커리큘럼이 없습니다.</p>
              )}
            </section>
          </div>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">과제 목록</h3>
              <Button asChild size="sm">
                <Link href={`/instructor/courses/${courseId}/assignments/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  과제 추가
                </Link>
              </Button>
            </div>

            {isAssignmentsLoading ? (
              <AssignmentSkeleton />
            ) : (assignmentsData?.assignments ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-center">
                <BookOpen className="mb-3 h-8 w-8 text-slate-300" />
                <p className="font-medium text-slate-500">등록된 과제가 없습니다.</p>
                <p className="mt-1 text-sm text-slate-400">위 버튼을 눌러 과제를 추가해보세요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(assignmentsData?.assignments ?? []).map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/instructor/assignments/${assignment.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-slate-900">{assignment.title}</p>
                      <p className="text-xs text-slate-500">
                        마감: {format(new Date(assignment.dueAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                        {' · '}
                        비중 {assignment.weight}%
                      </p>
                    </div>
                    <AssignmentStatusBadge status={assignment.status} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

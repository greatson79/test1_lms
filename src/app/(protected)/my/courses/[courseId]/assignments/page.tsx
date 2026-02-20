'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAssignmentListQuery } from '@/features/assignments/hooks/useAssignmentListQuery';
import { AssignmentCard } from '@/features/assignments/components/assignment-card';

type AssignmentListPageProps = {
  params: Promise<{ courseId: string }>;
};

const SKELETON_COUNT = 4;

export default function AssignmentListPage({ params }: AssignmentListPageProps) {
  const { courseId } = use(params);
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('learner');
  const { data, isLoading, isError, error, refetch } = useAssignmentListQuery(courseId);

  if (isRoleLoading || !isAllowed) return null;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse mb-6" />
        <div className="h-8 w-48 rounded bg-slate-100 animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </main>
    );
  }

  if (isError) {
    const isEnrollmentError = error?.message?.includes('수강 중인 코스');

    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          코스 목록으로 돌아가기
        </Link>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">
            {isEnrollmentError ? '수강 중인 코스가 아닙니다.' : '과제 목록을 불러오지 못했습니다.'}
          </p>
          {isEnrollmentError ? (
            <Link href="/courses" className="mt-4">
              <Button variant="outline" size="sm">코스 목록으로</Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              다시 시도
            </Button>
          )}
        </div>
      </main>
    );
  }

  const assignments = data?.assignments ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/courses/${courseId}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        코스로 돌아가기
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">과제 목록</h1>
        <p className="text-sm text-slate-500 mt-1">코스의 과제를 확인하고 제출하세요.</p>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">등록된 과제가 없습니다.</p>
          <p className="text-sm text-slate-400 mt-1">아직 공개된 과제가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} courseId={courseId} />
          ))}
        </div>
      )}
    </main>
  );
}

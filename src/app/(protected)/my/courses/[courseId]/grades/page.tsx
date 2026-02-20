'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useGradesQuery } from '@/features/grades/hooks/useGradesQuery';
import { GradeSummary } from '@/features/grades/components/grade-summary';
import { AssignmentGradeRow } from '@/features/grades/components/assignment-grade-row';

type GradesPageProps = {
  params: Promise<{ courseId: string }>;
};

const SKELETON_COUNT = 4;

export default function GradesPage({ params }: GradesPageProps) {
  const { courseId } = use(params);
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('learner');
  const { data, isLoading, isError, error, refetch } = useGradesQuery(courseId);

  if (isRoleLoading || !isAllowed) return null;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse mb-6" />
        <div className="h-8 w-48 rounded bg-slate-100 animate-pulse mb-6" />
        <div className="h-28 rounded-lg bg-slate-100 animate-pulse mb-6" />
        <div className="space-y-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
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
            {isEnrollmentError ? '수강 중인 코스가 아닙니다.' : '성적을 불러오지 못했습니다.'}
          </p>
          {isEnrollmentError ? (
            <Link href="/courses" className="mt-4">
              <Button variant="outline" size="sm">
                코스 목록으로
              </Button>
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
  const currentGrade = data?.currentGrade ?? null;

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
        <h1 className="text-2xl font-bold text-slate-900">내 성적</h1>
        <p className="text-sm text-slate-500 mt-1">과제별 제출 현황과 성적을 확인하세요.</p>
      </div>

      <div className="mb-6">
        <GradeSummary currentGrade={currentGrade} assignments={assignments} />
      </div>

      <Separator className="mb-4" />

      <h2 className="text-base font-semibold text-slate-900 mb-2">과제 목록</h2>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">등록된 과제가 없습니다.</p>
          <p className="text-sm text-slate-400 mt-1">아직 공개된 과제가 없습니다.</p>
        </div>
      ) : (
        <div>
          {assignments.map((assignment) => (
            <AssignmentGradeRow key={assignment.id} item={assignment} />
          ))}
        </div>
      )}
    </main>
  );
}

'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, CalendarClock, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useAssignmentDetailQuery } from '@/features/assignments/hooks/useAssignmentDetailQuery';
import { AssignmentSubmissionStatus } from '@/features/assignments/components/assignment-submission-status';

type AssignmentDetailPageProps = {
  params: Promise<{ courseId: string; assignmentId: string }>;
};

const SKELETON_LINES = 4;

export default function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { courseId, assignmentId } = use(params);
  const router = useRouter();
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('learner');
  const { data, isLoading, isError, error, refetch } = useAssignmentDetailQuery(
    courseId,
    assignmentId,
  );

  const isNotFound = error?.message?.includes('찾을 수 없습니다');

  useEffect(() => {
    if (isNotFound) {
      router.replace(`/my/courses/${courseId}/assignments`);
    }
  }, [isNotFound, courseId, router]);

  if (isRoleLoading || !isAllowed) return null;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse mb-6" />
        <div className="h-8 w-2/3 rounded bg-slate-100 animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: SKELETON_LINES }).map((_, i) => (
            <div key={i} className="h-4 rounded bg-slate-100 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (isError && !isNotFound) {
    const isEnrollmentError = error?.message?.includes('수강 중인 코스');

    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href={`/my/courses/${courseId}/assignments`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          과제 목록으로 돌아가기
        </Link>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-600 font-medium">
            {isEnrollmentError ? '수강 중인 코스가 아닙니다.' : '과제 정보를 불러오지 못했습니다.'}
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

  if (!data) return null;

  const { assignment } = data;
  const formattedDueAt = format(new Date(assignment.dueAt), 'yyyy년 M월 d일 HH:mm', {
    locale: ko,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/my/courses/${courseId}/assignments`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        과제 목록으로 돌아가기
      </Link>

      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {assignment.status === 'closed' && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                강제 마감
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" />
              마감: {formattedDueAt}
            </span>
            <span>배점: {assignment.weight}점</span>
            {assignment.allowLate && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-xs">
                지각 제출 허용
              </Badge>
            )}
            {assignment.allowResubmit && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-600 text-xs">
                재제출 허용
              </Badge>
            )}
          </div>
        </div>

        {assignment.description && (
          <>
            <Separator />
            <div>
              <h2 className="text-base font-semibold text-slate-900 mb-2">과제 설명</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>
          </>
        )}

        <Separator />

        <div>
          <h2 className="text-base font-semibold text-slate-900 mb-4">제출 현황</h2>
          <AssignmentSubmissionStatus assignment={assignment} />
        </div>
      </div>
    </main>
  );
}

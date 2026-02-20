'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, RefreshCw } from 'lucide-react';
import { match } from 'ts-pattern';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useInstructorAssignmentQuery } from '@/features/instructor-assignments/hooks/useInstructorAssignmentQuery';
import { useUpdateAssignmentStatusMutation } from '@/features/instructor-assignments/hooks/useUpdateAssignmentStatusMutation';
import { useInstructorAssignmentSubmissionsQuery } from '@/features/instructor-assignments/hooks/useInstructorAssignmentSubmissionsQuery';
import { AssignmentStatusButton } from '@/features/instructor-assignments/components/assignment-status-button';
import { SubmissionTable } from '@/features/instructor-assignments/components/submission-table';
import { GradePanel } from '@/features/instructor-assignments/components/grade-panel';
import type { SubmissionFilter, InstructorAssignmentDto, InstructorSubmissionItem } from '@/features/instructor-assignments/lib/dto';

type InstructorAssignmentPageProps = {
  params: Promise<{ assignmentId: string }>;
};

const DetailSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
    <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
    <div className="h-24 animate-pulse rounded bg-slate-100" />
    <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
  </div>
);

const AssignmentStatusBadge = ({ status }: { status: InstructorAssignmentDto['status'] }) => {
  const { label, variant } = match(status)
    .with('draft', () => ({ label: '초안', variant: 'secondary' as const }))
    .with('published', () => ({ label: '게시됨', variant: 'default' as const }))
    .with('closed', () => ({ label: '마감됨', variant: 'outline' as const }))
    .exhaustive();

  return <Badge variant={variant}>{label}</Badge>;
};

export default function InstructorAssignmentPage({ params }: InstructorAssignmentPageProps) {
  const { assignmentId } = use(params);
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('instructor');
  const { data, isLoading, isError, error, refetch } = useInstructorAssignmentQuery(assignmentId);
  const { mutate: changeStatus, isPending } = useUpdateAssignmentStatusMutation(assignmentId);
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionFilter>(undefined);
  const [selectedSubmission, setSelectedSubmission] = useState<InstructorSubmissionItem | null>(null);
  const {
    data: submissionsData,
    isLoading: isSubmissionsLoading,
  } = useInstructorAssignmentSubmissionsQuery(assignmentId, submissionFilter);

  const handleSelectSubmission = (submission: InstructorSubmissionItem) => {
    setSelectedSubmission(submission);
  };

  const handleClosePanel = () => {
    setSelectedSubmission(null);
  };

  if (isRoleLoading || !isAllowed) return null;

  const handlePublish = () => {
    changeStatus({ status: 'published' });
  };

  const handleClose = () => {
    changeStatus({ status: 'closed' });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        {data?.assignment.courseId && (
          <Link
            href={`/instructor/courses/${data.assignment.courseId}`}
            className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            코스로 돌아가기
          </Link>
        )}
        <h1 className="text-3xl font-semibold">과제 상세</h1>
      </header>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-24 text-center">
          <p className="font-medium text-slate-700">과제 정보를 불러오지 못했습니다.</p>
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
                <h2 className="text-2xl font-semibold text-slate-900">{data.assignment.title}</h2>
                <AssignmentStatusBadge status={data.assignment.status} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AssignmentStatusButton
                status={data.assignment.status}
                onPublish={handlePublish}
                onClose={handleClose}
                isPending={isPending}
              />
              <Button variant="outline" asChild>
                <Link href={`/instructor/assignments/${assignmentId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  수정
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
              <section className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-slate-500">마감일</h3>
                <p className="text-slate-700">
                  {format(new Date(data.assignment.dueAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                </p>
              </section>

              <section className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-slate-500">점수 비중</h3>
                <p className="text-slate-700">{data.assignment.weight}%</p>
              </section>

              <section className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-slate-500">지각 제출</h3>
                <p className="text-slate-700">{data.assignment.allowLate ? '허용' : '불허'}</p>
              </section>

              <section className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-slate-500">재제출</h3>
                <p className="text-slate-700">{data.assignment.allowResubmit ? '허용' : '불허'}</p>
              </section>
            </div>

            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-slate-500">설명</h3>
              {data.assignment.description ? (
                <p className="whitespace-pre-wrap text-slate-700">{data.assignment.description}</p>
              ) : (
                <p className="text-slate-400">설명이 없습니다.</p>
              )}
            </section>
          </div>

          <section className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-slate-900">제출물</h3>
            <div className={selectedSubmission ? 'grid grid-cols-1 gap-6 lg:grid-cols-2' : ''}>
              <SubmissionTable
                submissions={submissionsData?.submissions ?? []}
                totalCount={submissionsData?.totalCount ?? 0}
                currentFilter={submissionFilter}
                onFilterChange={setSubmissionFilter}
                isLoading={isSubmissionsLoading}
                onSelectSubmission={handleSelectSubmission}
                selectedSubmissionId={selectedSubmission?.id}
                allowResubmit={data?.assignment.allowResubmit}
              />
              {selectedSubmission && (
                <GradePanel
                  submission={selectedSubmission}
                  assignmentId={assignmentId}
                  allowResubmit={data?.assignment.allowResubmit ?? false}
                  onClose={handleClosePanel}
                />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

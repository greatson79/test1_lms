'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useInstructorAssignmentQuery } from '@/features/instructor-assignments/hooks/useInstructorAssignmentQuery';
import { useUpdateAssignmentMutation } from '@/features/instructor-assignments/hooks/useUpdateAssignmentMutation';
import { AssignmentForm } from '@/features/instructor-assignments/components/assignment-form';

type EditAssignmentPageProps = {
  params: Promise<{ assignmentId: string }>;
};

const FormSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
    <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
    <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
    <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
    <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
    <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
  </div>
);

export default function EditAssignmentPage({ params }: EditAssignmentPageProps) {
  const { assignmentId } = use(params);
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('instructor');
  const { data, isLoading, isError, error: queryError, refetch } = useInstructorAssignmentQuery(assignmentId);
  const { mutate: updateAssignment, isPending, error: mutationError } = useUpdateAssignmentMutation(assignmentId);

  if (isRoleLoading || !isAllowed) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Link
          href={`/instructor/assignments/${assignmentId}`}
          className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          과제 상세로 돌아가기
        </Link>
        <h1 className="text-3xl font-semibold">과제 수정</h1>
      </header>

      {mutationError && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{mutationError.message}</p>
      )}

      {isLoading ? (
        <FormSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-24 text-center">
          <p className="font-medium text-slate-700">과제 정보를 불러오지 못했습니다.</p>
          <p className="mt-1 text-sm text-slate-400">{queryError?.message}</p>
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
        <AssignmentForm
          defaultValues={{
            title: data.assignment.title,
            description: data.assignment.description,
            dueAt: data.assignment.dueAt,
            weight: data.assignment.weight,
            allowLate: data.assignment.allowLate,
            allowResubmit: data.assignment.allowResubmit,
          }}
          onSubmit={(values) => updateAssignment(values)}
          isPending={isPending}
          submitLabel="과제 수정"
        />
      ) : null}
    </div>
  );
}

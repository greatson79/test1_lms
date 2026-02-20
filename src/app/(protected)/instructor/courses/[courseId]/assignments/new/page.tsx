'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { useCreateAssignmentMutation } from '@/features/instructor-assignments/hooks/useCreateAssignmentMutation';
import { AssignmentForm } from '@/features/instructor-assignments/components/assignment-form';

type NewAssignmentPageProps = {
  params: Promise<{ courseId: string }>;
};

export default function NewAssignmentPage({ params }: NewAssignmentPageProps) {
  const { courseId } = use(params);
  const { isAllowed, isLoading: isRoleLoading } = useRoleGuard('instructor');
  const { mutate, isPending, error } = useCreateAssignmentMutation(courseId);

  if (isRoleLoading || !isAllowed) return null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Link
          href={`/instructor/courses/${courseId}`}
          className="flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          코스로 돌아가기
        </Link>
        <h1 className="text-3xl font-semibold">과제 추가</h1>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error.message}</p>
      )}

      <AssignmentForm
        onSubmit={(values) => mutate(values)}
        isPending={isPending}
        submitLabel="과제 생성"
      />
    </div>
  );
}

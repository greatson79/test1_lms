'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FileText } from 'lucide-react';
import type { RecentSubmissionItem } from '@/features/instructor-dashboard/lib/dto';

type RecentSubmissionsSectionProps = {
  submissions: RecentSubmissionItem[];
};

type SubmissionRowProps = {
  submission: RecentSubmissionItem;
};

const SubmissionRow = ({ submission }: SubmissionRowProps) => {
  const submittedDate = new Date(submission.submittedAt);
  const formattedDate = format(submittedDate, 'yyyy. M. d. a h:mm', { locale: ko });

  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50">
        <FileText className="h-4 w-4 text-slate-500" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {submission.learnerName}
        </p>
        <p className="truncate text-xs text-slate-500">
          {submission.assignmentTitle} · {submission.courseTitle}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-slate-400">{formattedDate}</p>
      </div>
    </li>
  );
};

export const RecentSubmissionsSection = ({ submissions }: RecentSubmissionsSectionProps) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-lg font-semibold text-slate-900">최근 제출물</h2>
    {submissions.length === 0 ? (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center">
        <p className="text-sm text-slate-400">최근 제출물이 없습니다.</p>
      </div>
    ) : (
      <ul className="flex flex-col gap-2">
        {submissions.map((s) => (
          <SubmissionRow key={s.submissionId} submission={s} />
        ))}
      </ul>
    )}
  </section>
);

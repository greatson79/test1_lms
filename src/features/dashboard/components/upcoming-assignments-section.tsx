'use client';

import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UpcomingAssignment } from '@/features/dashboard/lib/dto';

type UpcomingAssignmentsSectionProps = {
  assignments: UpcomingAssignment[];
};

type AssignmentRowProps = {
  assignment: UpcomingAssignment;
};

const AssignmentRow = ({ assignment }: AssignmentRowProps) => {
  const dueDate = new Date(assignment.dueAt);
  const relativeTime = formatDistanceToNow(dueDate, { addSuffix: true, locale: ko });
  const formattedDate = format(dueDate, 'MM/dd HH:mm');

  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50">
      <div
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          assignment.isSubmitted ? 'bg-green-50' : 'bg-orange-50',
        ].join(' ')}
      >
        {assignment.isSubmitted ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <CalendarClock className="h-4 w-4 text-orange-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{assignment.title}</p>
        <p className="truncate text-xs text-slate-500">{assignment.courseTitle}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs font-medium text-slate-700">{formattedDate}</p>
        <p className="text-xs text-slate-400">{relativeTime}</p>
      </div>

      {assignment.isSubmitted && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          제출됨
        </Badge>
      )}
    </li>
  );
};

export const UpcomingAssignmentsSection = ({
  assignments,
}: UpcomingAssignmentsSectionProps) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-lg font-semibold text-slate-900">마감 임박 과제</h2>
    {assignments.length === 0 ? (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center">
        <p className="text-sm text-slate-400">임박한 과제가 없습니다.</p>
      </div>
    ) : (
      <ul className="flex flex-col gap-2">
        {assignments.map((a) => (
          <AssignmentRow key={a.id} assignment={a} />
        ))}
      </ul>
    )}
  </section>
);

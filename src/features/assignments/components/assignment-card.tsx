'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarClock, CheckCircle2, AlertCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import type { AssignmentDto } from '@/features/assignments/lib/dto';

type AssignmentCardProps = {
  assignment: AssignmentDto;
  courseId: string;
};

type BadgeConfig = {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon: React.ReactNode;
};

const isSubmitDisabled = (assignment: AssignmentDto): boolean =>
  assignment.status === 'closed' ||
  (new Date() > new Date(assignment.dueAt) && !assignment.allowLate);

const getStatusBadge = (assignment: AssignmentDto): BadgeConfig => {
  if (assignment.status === 'closed') {
    return {
      label: '강제 마감',
      variant: 'secondary',
      className: 'bg-slate-100 text-slate-600',
      icon: <XCircle className="h-3 w-3" />,
    };
  }

  const isPastDue = new Date() > new Date(assignment.dueAt);

  if (isPastDue && !assignment.allowLate) {
    return {
      label: '마감됨',
      variant: 'secondary',
      className: 'bg-slate-100 text-slate-600',
      icon: <XCircle className="h-3 w-3" />,
    };
  }

  if (isPastDue && assignment.allowLate) {
    return {
      label: '지각 제출 가능',
      variant: 'secondary',
      className: 'bg-blue-50 text-blue-600',
      icon: <Clock className="h-3 w-3" />,
    };
  }

  if (!assignment.mySubmission) {
    return {
      label: '미제출',
      variant: 'secondary',
      className: 'bg-orange-50 text-orange-600',
      icon: <AlertCircle className="h-3 w-3" />,
    };
  }

  if (assignment.mySubmission.status === 'resubmission_required') {
    return {
      label: '재제출 필요',
      variant: 'secondary',
      className: 'bg-yellow-50 text-yellow-600',
      icon: <RefreshCw className="h-3 w-3" />,
    };
  }

  return {
    label: '제출완료',
    variant: 'secondary',
    className: 'bg-green-50 text-green-600',
    icon: <CheckCircle2 className="h-3 w-3" />,
  };
};

export const AssignmentCard = ({ assignment, courseId }: AssignmentCardProps) => {
  const badge = getStatusBadge(assignment);
  const disabled = isSubmitDisabled(assignment);
  const formattedDueAt = format(new Date(assignment.dueAt), 'yyyy년 M월 d일 HH:mm', { locale: ko });

  return (
    <Link
      href={`/my/courses/${courseId}/assignments/${assignment.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card className={`h-full transition-shadow hover:shadow-md ${disabled ? 'opacity-70' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm leading-snug text-slate-900 flex-1 line-clamp-2">
              {assignment.title}
            </h3>
            <Badge
              variant={badge.variant}
              className={`shrink-0 flex items-center gap-1 text-xs ${badge.className}`}
            >
              {badge.icon}
              {badge.label}
            </Badge>
          </div>

          {assignment.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{assignment.description}</p>
          )}
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            마감: {formattedDueAt}
          </span>
          <span className="text-slate-400">배점 {assignment.weight}점</span>
        </CardFooter>
      </Card>
    </Link>
  );
};

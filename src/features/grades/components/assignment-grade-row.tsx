'use client';

import { match } from 'ts-pattern';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { AssignmentGradeItem } from '@/features/grades/lib/dto';

type AssignmentGradeRowProps = {
  item: AssignmentGradeItem;
};

type SubmissionState =
  | { type: 'not_submitted' }
  | { type: 'submitted' }
  | { type: 'resubmission_required'; feedback: string | null }
  | { type: 'graded'; score: number | null; feedback: string | null; isLate: boolean };

const resolveSubmissionState = (item: AssignmentGradeItem): SubmissionState => {
  if (!item.mySubmission) return { type: 'not_submitted' };

  const sub = item.mySubmission;

  return match(sub.status)
    .with('submitted', () => ({ type: 'submitted' as const }))
    .with('resubmission_required', () => ({
      type: 'resubmission_required' as const,
      feedback: sub.feedback,
    }))
    .with('graded', () => ({
      type: 'graded' as const,
      score: sub.score,
      feedback: sub.feedback,
      isLate: sub.isLate,
    }))
    .exhaustive();
};

export const AssignmentGradeRow = ({ item }: AssignmentGradeRowProps) => {
  const state = resolveSubmissionState(item);
  const formattedDueAt = format(new Date(item.dueAt), 'yyyy년 M월 d일 HH:mm', { locale: ko });

  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-slate-900 truncate">{item.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">마감: {formattedDueAt}</p>
          <p className="text-xs text-slate-400">배점: {item.weight}점</p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {match(state)
            .with({ type: 'not_submitted' }, () => (
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                미제출
              </Badge>
            ))
            .with({ type: 'submitted' }, () => (
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                채점 대기중
              </Badge>
            ))
            .with({ type: 'resubmission_required' }, () => (
              <Badge variant="secondary" className="bg-yellow-50 text-yellow-600 flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                재제출 요청
              </Badge>
            ))
            .with({ type: 'graded' }, ({ score, isLate }) => (
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-slate-900">
                  {score !== null ? `${score}점` : '-'}
                </span>
                {isLate && (
                  <Badge variant="secondary" className="bg-orange-50 text-orange-500 flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    지각 제출
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-green-50 text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  채점 완료
                </Badge>
              </div>
            ))
            .exhaustive()}
        </div>
      </div>

      {match(state)
        .with({ type: 'resubmission_required' }, ({ feedback }) =>
          feedback ? (
            <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-100 px-3 py-2">
              <p className="text-xs text-yellow-700 font-medium mb-0.5">강사 피드백</p>
              <p className="text-xs text-yellow-600">{feedback}</p>
            </div>
          ) : null,
        )
        .with({ type: 'graded' }, ({ feedback }) =>
          feedback ? (
            <div className="mt-2 rounded-md bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500 font-medium mb-0.5">강사 피드백</p>
              <p className="text-xs text-slate-600">{feedback}</p>
            </div>
          ) : null,
        )
        .otherwise(() => null)}

      <Separator className="mt-4" />
    </div>
  );
};

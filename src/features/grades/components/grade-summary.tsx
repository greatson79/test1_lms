'use client';

import { match } from 'ts-pattern';
import { TrendingUp, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AssignmentGradeItem } from '@/features/grades/lib/dto';

type GradeSummaryProps = {
  currentGrade: number | null;
  estimatedFinalGrade: number;
  assignments: AssignmentGradeItem[];
};

type SummaryState =
  | { type: 'graded'; grade: number }
  | { type: 'pending' }
  | { type: 'no_assignments' };

const resolveSummaryState = (
  currentGrade: number | null,
  assignments: AssignmentGradeItem[],
): SummaryState => {
  if (currentGrade !== null) return { type: 'graded', grade: currentGrade };
  if (assignments.length === 0) return { type: 'no_assignments' };

  const hasPendingSubmission = assignments.some(
    (a) =>
      a.mySubmission?.status === 'submitted' ||
      a.mySubmission?.status === 'resubmission_required',
  );
  return hasPendingSubmission ? { type: 'pending' } : { type: 'no_assignments' };
};

export const GradeSummary = ({ currentGrade, estimatedFinalGrade, assignments }: GradeSummaryProps) => {
  const summaryState = resolveSummaryState(currentGrade, assignments);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">현재 성적</CardTitle>
        </CardHeader>
        <CardContent>
          {match(summaryState)
            .with({ type: 'graded' }, ({ grade }) => (
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-500 shrink-0" />
                <div>
                  <p className="text-3xl font-bold text-slate-900">
                    {Math.round(grade)}점
                    <span className="text-lg font-normal text-slate-400"> / 100점</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">채점 완료된 과제 기준 가중 평균</p>
                </div>
              </div>
            ))
            .with({ type: 'pending' }, () => (
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-blue-400 shrink-0" />
                <div>
                  <p className="text-base font-medium text-slate-700">채점 대기중인 과제가 있습니다.</p>
                  <p className="text-sm text-slate-500 mt-0.5">강사가 채점을 완료하면 성적이 표시됩니다.</p>
                </div>
              </div>
            ))
            .with({ type: 'no_assignments' }, () => (
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-slate-300 shrink-0" />
                <div>
                  <p className="text-base font-medium text-slate-700">아직 채점된 과제가 없습니다.</p>
                  <p className="text-sm text-slate-500 mt-0.5">과제를 제출하면 성적이 표시됩니다.</p>
                </div>
              </div>
            ))
            .exhaustive()}
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">예상 최종 성적</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-slate-400 shrink-0" />
            <div>
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(estimatedFinalGrade)}점
                <span className="text-lg font-normal text-slate-400"> / 100점</span>
              </p>
              <p className="text-sm text-slate-500 mt-0.5">미채점·미제출 과제는 0점으로 계산</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

'use client';

import { useState } from 'react';
import { match } from 'ts-pattern';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, XCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SubmissionForm } from '@/features/submissions/components/submission-form';
import type { AssignmentDto, MySubmissionDto } from '@/features/assignments/lib/dto';

type AssignmentSubmissionStatusProps = {
  assignment: AssignmentDto;
  courseId: string;
  assignmentId: string;
};

type SubmissionState =
  | { type: 'closed' }
  | { type: 'no_submission' }
  | { type: 'resubmit'; submission: MySubmissionDto }
  | { type: 'submitted'; submission: MySubmissionDto };

const resolveSubmissionState = (assignment: AssignmentDto): SubmissionState => {
  const isPastDue = new Date() > new Date(assignment.dueAt);
  const isEffectivelyClosed =
    assignment.status === 'closed' || (isPastDue && !assignment.allowLate);

  if (isEffectivelyClosed) {
    return { type: 'closed' };
  }

  if (!assignment.mySubmission) {
    return { type: 'no_submission' };
  }

  if (
    assignment.mySubmission.status === 'resubmission_required' &&
    assignment.allowResubmit
  ) {
    return { type: 'resubmit', submission: assignment.mySubmission };
  }

  return { type: 'submitted', submission: assignment.mySubmission };
};

const SubmissionHistoryCard = ({ submission }: { submission: MySubmissionDto }) => {
  const formattedSubmittedAt = format(
    new Date(submission.submittedAt),
    'yyyy년 M월 d일 HH:mm',
    { locale: ko },
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          제출 내역
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">제출 시간</span>
          <span className="text-slate-700 font-medium">{formattedSubmittedAt}</span>
        </div>

        {submission.isLate && (
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="bg-orange-50 text-orange-600 flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              지각 제출
            </Badge>
          </div>
        )}

        {submission.score !== null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              점수
            </span>
            <span className="text-slate-900 font-bold text-base">{submission.score}점</span>
          </div>
        )}

        {submission.score === null && (
          <p className="text-xs text-slate-400">아직 채점되지 않았습니다.</p>
        )}

        {submission.feedback && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">피드백</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {submission.feedback}
              </p>
            </div>
          </>
        )}

        {submission.contentText && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">제출 내용</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
                {submission.contentText}
              </p>
            </div>
          </>
        )}

        {submission.contentLink && (
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">제출 링크</p>
            <a
              href={submission.contentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {submission.contentLink}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AssignmentSubmissionStatus = ({
  assignment,
  courseId,
  assignmentId,
}: AssignmentSubmissionStatusProps) => {
  const [showForm, setShowForm] = useState(false);
  const state = resolveSubmissionState(assignment);
  const isPastDue = new Date() > new Date(assignment.dueAt);

  return (
    <div className="space-y-4">
      {isPastDue && assignment.allowLate && assignment.status !== 'closed' && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            지각 제출 가능
          </Badge>
        </div>
      )}

      {match(state)
        .with({ type: 'closed' }, () => (
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <XCircle className="h-5 w-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-600">마감된 과제입니다</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {assignment.status === 'closed'
                  ? '강사에 의해 강제 마감되었습니다.'
                  : '마감 기한이 지났습니다.'}
              </p>
            </div>
          </div>
        ))
        .with({ type: 'no_submission' }, () =>
          showForm ? (
            <SubmissionForm
              courseId={courseId}
              assignmentId={assignmentId}
              mode="submit"
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <AlertCircle className="h-5 w-5 text-orange-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-700">아직 제출하지 않은 과제입니다</p>
              </div>
              <Button
                size="sm"
                className="shrink-0"
                onClick={() => setShowForm(true)}
              >
                제출하기
              </Button>
            </div>
          ),
        )
        .with({ type: 'resubmit' }, ({ submission }) => (
          <div className="space-y-3">
            {showForm ? (
              <SubmissionForm
                courseId={courseId}
                assignmentId={assignmentId}
                mode="resubmit"
                defaultValues={{
                  contentText: submission.contentText ?? '',
                  contentLink: submission.contentLink ?? undefined,
                }}
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <RefreshCw className="h-5 w-5 text-yellow-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-700">재제출이 요청되었습니다</p>
                  <p className="text-xs text-yellow-600 mt-0.5">
                    강사의 피드백을 확인하고 다시 제출해 주세요.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-yellow-400 text-yellow-700"
                  onClick={() => setShowForm(true)}
                >
                  재제출하기
                </Button>
              </div>
            )}
            <SubmissionHistoryCard submission={submission} />
          </div>
        ))
        .with({ type: 'submitted' }, ({ submission }) => (
          <SubmissionHistoryCard submission={submission} />
        ))
        .exhaustive()}
    </div>
  );
};

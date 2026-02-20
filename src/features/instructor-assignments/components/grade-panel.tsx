'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { match } from 'ts-pattern';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ExternalLink, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useGradeSubmissionMutation } from '@/features/instructor-assignments/hooks/useGradeSubmissionMutation';
import { useRequestResubmissionMutation } from '@/features/instructor-assignments/hooks/useRequestResubmissionMutation';
import { useSubmissionDetailQuery } from '@/features/instructor-assignments/hooks/useSubmissionDetailQuery';
import {
  GradeSubmissionBodySchema,
  RequestResubmissionBodySchema,
} from '@/features/instructor-assignments/lib/dto';
import type {
  GradeSubmissionBody,
  RequestResubmissionBody,
  InstructorSubmissionItem,
} from '@/features/instructor-assignments/lib/dto';

type GradeMode = 'grade' | 'resubmission';

type GradePanelProps = {
  submission: InstructorSubmissionItem;
  assignmentId: string;
  allowResubmit: boolean;
  onClose: () => void;
};

const SubmissionStatusBadge = ({ status }: { status: InstructorSubmissionItem['status'] }) => {
  const { label, variant } = match(status)
    .with('submitted', () => ({ label: '미채점', variant: 'secondary' as const }))
    .with('graded', () => ({ label: '채점 완료', variant: 'default' as const }))
    .with('resubmission_required', () => ({ label: '재제출 요청', variant: 'destructive' as const }))
    .with('invalidated', () => ({ label: '무효화', variant: 'outline' as const }))
    .exhaustive();

  return <Badge variant={variant}>{label}</Badge>;
};

const DetailSkeleton = () => (
  <div className="flex flex-col gap-3">
    <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
    <div className="h-16 w-full animate-pulse rounded bg-slate-100" />
  </div>
);

export const GradePanel = ({
  submission,
  assignmentId,
  allowResubmit,
  onClose,
}: GradePanelProps) => {
  const [mode, setMode] = useState<GradeMode>('grade');
  const { toast } = useToast();

  const { data: detailData, isLoading: isDetailLoading } = useSubmissionDetailQuery(submission.id);

  const gradeMutation = useGradeSubmissionMutation(assignmentId);
  const resubmitMutation = useRequestResubmissionMutation(assignmentId);

  const gradeForm = useForm<GradeSubmissionBody>({
    resolver: zodResolver(GradeSubmissionBodySchema),
    defaultValues: { score: 0, feedback: '' },
  });

  const resubmitForm = useForm<RequestResubmissionBody>({
    resolver: zodResolver(RequestResubmissionBodySchema),
    defaultValues: { feedback: '' },
  });

  const handleGradeSubmit = (values: GradeSubmissionBody) => {
    gradeMutation.mutate(
      { submissionId: submission.id, body: values },
      {
        onSuccess: () => {
          toast({ title: '채점 완료', description: '채점이 완료되었습니다.' });
          onClose();
        },
        onError: (error) => {
          toast({ title: '오류', description: error.message, variant: 'destructive' });
        },
      },
    );
  };

  const handleResubmitSubmit = (values: RequestResubmissionBody) => {
    resubmitMutation.mutate(
      { submissionId: submission.id, body: values },
      {
        onSuccess: () => {
          toast({ title: '재제출 요청', description: '재제출 요청이 전송되었습니다.' });
          onClose();
        },
        onError: (error) => {
          toast({ title: '오류', description: error.message, variant: 'destructive' });
        },
      },
    );
  };

  const detail = detailData?.submission;

  return (
    <div className="flex h-full flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-slate-900">{submission.learnerName}</h3>
          <div className="flex items-center gap-2">
            <SubmissionStatusBadge status={submission.status} />
            {submission.isLate && (
              <Badge variant="destructive" className="text-xs">지각</Badge>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="패널 닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <h4 className="text-sm font-medium text-slate-500">제출물 정보</h4>
        {isDetailLoading ? (
          <DetailSkeleton />
        ) : detail ? (
          <div className="flex flex-col gap-2 text-sm text-slate-700">
            <p className="text-slate-500">
              제출 시각:{' '}
              {format(new Date(detail.submittedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
            </p>
            {detail.contentText && (
              <div className="flex flex-col gap-1">
                <span className="font-medium text-slate-600">내용</span>
                <p className="whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 text-slate-700">
                  {detail.contentText}
                </p>
              </div>
            )}
            {detail.contentLink && (
              <div className="flex flex-col gap-1">
                <span className="font-medium text-slate-600">링크</span>
                <a
                  href={detail.contentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 underline hover:text-blue-800"
                >
                  {detail.contentLink}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
            )}
            {!detail.contentText && !detail.contentLink && (
              <p className="text-slate-400">제출 내용이 없습니다.</p>
            )}
            {detail.feedback && (
              <div className="flex flex-col gap-1">
                <span className="font-medium text-slate-600">기존 피드백</span>
                <p className="whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 text-slate-700">
                  {detail.feedback}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">제출물 상세 정보를 불러오지 못했습니다.</p>
        )}
      </div>

      {allowResubmit && (
        <div className="flex gap-2 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setMode('grade')}
            className={[
              'rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
              mode === 'grade'
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            채점 완료
          </button>
          <button
            type="button"
            onClick={() => setMode('resubmission')}
            className={[
              'rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
              mode === 'resubmission'
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            재제출 요청
          </button>
        </div>
      )}

      {mode === 'grade' ? (
        <Form {...gradeForm}>
          <form
            onSubmit={gradeForm.handleSubmit(handleGradeSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={gradeForm.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>점수 (0 ~ 100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="점수를 입력해 주세요"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={gradeForm.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>피드백</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="학습자에게 전달할 피드백을 입력해 주세요"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={gradeMutation.isPending}>
              {gradeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              채점 완료
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...resubmitForm}>
          <form
            onSubmit={resubmitForm.handleSubmit(handleResubmitSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={resubmitForm.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>재제출 요청 사유</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="재제출을 요청하는 이유를 입력해 주세요"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" variant="destructive" disabled={resubmitMutation.isPending}>
              {resubmitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              재제출 요청
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};

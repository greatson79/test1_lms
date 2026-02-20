'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { match } from 'ts-pattern';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSubmitAssignmentMutation } from '@/features/submissions/hooks/useSubmitAssignmentMutation';
import { useResubmitAssignmentMutation } from '@/features/submissions/hooks/useResubmitAssignmentMutation';
import { SubmitRequestSchema } from '@/features/submissions/lib/dto';
import type { SubmitRequest } from '@/features/submissions/lib/dto';

type SubmissionFormProps = {
  courseId: string;
  assignmentId: string;
  mode: 'submit' | 'resubmit';
  defaultValues?: {
    contentText: string;
    contentLink?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

const SUCCESS_MESSAGES = {
  submit: '제출이 완료되었습니다.',
  resubmit: '재제출이 완료되었습니다.',
} as const;

const SUBMIT_BUTTON_LABELS = {
  submit: '제출하기',
  resubmit: '재제출하기',
} as const;

export const SubmissionForm = ({
  courseId,
  assignmentId,
  mode,
  defaultValues,
  onSuccess,
  onCancel,
}: SubmissionFormProps) => {
  const { toast } = useToast();

  const submitMutation = useSubmitAssignmentMutation(courseId, assignmentId);
  const resubmitMutation = useResubmitAssignmentMutation(courseId, assignmentId);

  const activeMutation = match(mode)
    .with('submit', () => submitMutation)
    .with('resubmit', () => resubmitMutation)
    .exhaustive();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<SubmitRequest>({
    resolver: zodResolver(SubmitRequestSchema),
    defaultValues: {
      contentText: defaultValues?.contentText ?? '',
      contentLink: defaultValues?.contentLink ?? undefined,
    },
  });

  const onSubmit = useCallback(
    async (values: SubmitRequest) => {
      const payload: SubmitRequest = {
        contentText: values.contentText,
        contentLink: values.contentLink && values.contentLink.trim() !== ''
          ? values.contentLink.trim()
          : undefined,
      };

      try {
        const result = await activeMutation.mutateAsync(payload);

        toast({
          title: '완료',
          description: SUCCESS_MESSAGES[mode],
        });

        if (result.submission.isLate) {
          toast({
            title: '안내',
            description: '지각 제출로 처리되었습니다.',
          });
        }

        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : '오류가 발생했습니다.';
        setError('root', { message });
      }
    },
    [activeMutation, mode, toast, onSuccess, setError],
  );

  const handleCancel = useCallback(() => {
    clearErrors();
    onCancel?.();
  }, [clearErrors, onCancel]);

  const isPending = activeMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border border-slate-200 p-4">
      {errors.root && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-600">{errors.root.message}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="contentText">
          제출 내용 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="contentText"
          rows={6}
          placeholder="과제 내용을 입력해주세요."
          disabled={isPending}
          {...register('contentText')}
        />
        {errors.contentText && (
          <p className="text-xs text-red-500">{errors.contentText.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contentLink">
          제출 링크 <span className="text-slate-400 text-xs font-normal">(선택)</span>
        </Label>
        <Input
          id="contentLink"
          type="url"
          placeholder="https://example.com"
          disabled={isPending}
          {...register('contentLink')}
        />
        {errors.contentLink && (
          <p className="text-xs text-red-500">{errors.contentLink.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
        >
          취소
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {SUBMIT_BUTTON_LABELS[mode]}
        </Button>
      </div>
    </form>
  );
};

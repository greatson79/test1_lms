'use client';

import { useCallback } from 'react';
import { BookOpen, BookX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEnrollMutation } from '@/features/enrollments/hooks/useEnrollMutation';
import { useCancelEnrollmentMutation } from '@/features/enrollments/hooks/useCancelEnrollmentMutation';

type EnrollmentStatus = 'active' | 'cancelled' | null;

type EnrollmentButtonProps = {
  courseId: string;
  enrollmentStatus: EnrollmentStatus;
  canEnroll: boolean;
};

export const EnrollmentButton = ({
  courseId,
  enrollmentStatus,
  canEnroll,
}: EnrollmentButtonProps) => {
  const { toast } = useToast();

  const enrollMutation = useEnrollMutation(courseId);
  const cancelMutation = useCancelEnrollmentMutation(courseId);

  const isActive = enrollmentStatus === 'active';
  const isPending = enrollMutation.isPending || cancelMutation.isPending;

  const handleEnroll = useCallback(async () => {
    const result = await enrollMutation.mutateAsync();

    if (result) {
      const message = result.action === 're-enrolled' ? '재수강 신청이 완료되었습니다.' : '수강신청이 완료되었습니다.';
      toast({ title: '수강신청 완료', description: message });
    }
  }, [enrollMutation, toast]);

  const handleCancel = useCallback(async () => {
    await cancelMutation.mutateAsync();
    toast({
      title: '수강 취소',
      description: '수강이 취소되었습니다.',
      variant: 'destructive',
    });
  }, [cancelMutation, toast]);

  const handleEnrollError = useCallback(
    (error: Error) => {
      toast({ title: '오류', description: error.message, variant: 'destructive' });
    },
    [toast],
  );

  if (!canEnroll) {
    return null;
  }

  if (isActive) {
    return (
      <Button
        variant="destructive"
        onClick={() => {
          handleCancel().catch(handleEnrollError);
        }}
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        {cancelMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <BookX className="h-4 w-4 mr-2" />
        )}
        수강취소
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        handleEnroll().catch(handleEnrollError);
      }}
      disabled={isPending}
      className="w-full sm:w-auto"
    >
      {enrollMutation.isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <BookOpen className="h-4 w-4 mr-2" />
      )}
      수강신청
    </Button>
  );
};

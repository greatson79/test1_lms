'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { CancelEnrollmentResponseSchema } from '@/features/enrollments/lib/dto';
import type { CancelEnrollmentResponse } from '@/features/enrollments/lib/dto';

const cancelEnrollment = async (courseId: string): Promise<CancelEnrollmentResponse> => {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('인증이 필요합니다.');
  }

  try {
    const { data } = await apiClient.delete(`/api/enrollments/${courseId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    return CancelEnrollmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '수강취소에 실패했습니다.');
    throw new Error(message);
  }
};

export const useCancelEnrollmentMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CancelEnrollmentResponse, Error, void>({
    mutationFn: () => cancelEnrollment(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    throwOnError: false,
  });
};

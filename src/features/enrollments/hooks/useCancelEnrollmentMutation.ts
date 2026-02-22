'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { CancelEnrollmentResponseSchema } from '@/features/enrollments/lib/dto';
import type { CancelEnrollmentResponse } from '@/features/enrollments/lib/dto';

const cancelEnrollment = async (courseId: string): Promise<CancelEnrollmentResponse> => {
  const headers = await getAuthHeadersOrThrow();

  try {
    const { data } = await apiClient.delete(`/api/enrollments/${courseId}`, { headers });
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
      queryClient.invalidateQueries({ queryKey: ['enrollment-status', courseId] });
      queryClient.invalidateQueries({ queryKey: ['learner', 'dashboard'] });
    },
    throwOnError: false,
  });
};

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { EnrollResponseSchema } from '@/features/enrollments/lib/dto';
import type { EnrollResponse } from '@/features/enrollments/lib/dto';

const enroll = async (courseId: string): Promise<EnrollResponse> => {
  const headers = await getAuthHeadersOrThrow();

  try {
    const { data } = await apiClient.post(
      '/api/enrollments',
      { courseId },
      { headers },
    );
    return EnrollResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '수강신청에 실패했습니다.');
    throw new Error(message);
  }
};

export const useEnrollMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation<EnrollResponse, Error, void>({
    mutationFn: () => enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-status', courseId] });
    },
    throwOnError: false,
  });
};

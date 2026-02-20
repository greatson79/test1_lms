'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { EnrollResponseSchema } from '@/features/enrollments/lib/dto';
import type { EnrollResponse } from '@/features/enrollments/lib/dto';

const enroll = async (courseId: string): Promise<EnrollResponse> => {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('인증이 필요합니다.');
  }

  try {
    const { data } = await apiClient.post(
      '/api/enrollments',
      { courseId },
      { headers: { Authorization: `Bearer ${session.access_token}` } },
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
    },
    throwOnError: false,
  });
};

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorCourseResponseSchema } from '@/features/instructor-courses/lib/dto';
import type { UpdateCourseStatusBody } from '@/features/instructor-courses/lib/dto';

const updateCourseStatusApi = async ({
  courseId,
  body,
}: {
  courseId: string;
  body: UpdateCourseStatusBody;
}) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.patch(
      `/api/instructor/courses/${courseId}/status`,
      body,
      { headers },
    );
    return InstructorCourseResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '코스 상태 변경에 실패했습니다.');
    throw new Error(message);
  }
};

export const useUpdateCourseStatusMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateCourseStatusBody) => updateCourseStatusApi({ courseId, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'courses', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};

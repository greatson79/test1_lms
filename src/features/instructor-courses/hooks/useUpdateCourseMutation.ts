'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorCourseResponseSchema } from '@/features/instructor-courses/lib/dto';
import type { UpdateCourseBody } from '@/features/instructor-courses/lib/dto';

const updateCourseApi = async ({
  courseId,
  body,
}: {
  courseId: string;
  body: UpdateCourseBody;
}) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.put(`/api/instructor/courses/${courseId}`, body, { headers });
    return InstructorCourseResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '코스 수정에 실패했습니다.');
    throw new Error(message);
  }
};

export const useUpdateCourseMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateCourseBody) => updateCourseApi({ courseId, body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'courses', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};

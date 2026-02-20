'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorCourseResponseSchema } from '@/features/instructor-courses/lib/dto';
import type { CreateCourseBody } from '@/features/instructor-courses/lib/dto';

const createCourseApi = async (body: CreateCourseBody) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.post('/api/instructor/courses', body, { headers });
    return InstructorCourseResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '코스 생성에 실패했습니다.');
    throw new Error(message);
  }
};

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: createCourseApi,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
      router.push(`/instructor/courses/${data.course.id}`);
    },
  });
};

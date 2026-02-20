'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorCourseWithMetaResponseSchema } from '@/features/instructor-courses/lib/dto';
import type { InstructorCourseWithMetaResponse } from '@/features/instructor-courses/lib/dto';

const fetchInstructorCourse = async (courseId: string): Promise<InstructorCourseWithMetaResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get(`/api/instructor/courses/${courseId}`, { headers });
    return InstructorCourseWithMetaResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '코스 정보를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

const STALE_TIME_MS = 30 * 1000;

export const useInstructorCourseQuery = (courseId: string) =>
  useQuery({
    queryKey: ['instructor', 'courses', courseId],
    queryFn: () => fetchInstructorCourse(courseId),
    enabled: Boolean(courseId),
    staleTime: STALE_TIME_MS,
  });

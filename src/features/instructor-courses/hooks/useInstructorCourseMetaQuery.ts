'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorCourseMetaOnlyResponseSchema } from '@/features/instructor-courses/lib/dto';
import type { InstructorCourseMetaOnlyResponse } from '@/features/instructor-courses/lib/dto';

const fetchInstructorCourseMeta = async (): Promise<InstructorCourseMetaOnlyResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get('/api/instructor/courses/meta', { headers });
    return InstructorCourseMetaOnlyResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '카테고리/난이도 정보를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

const STALE_TIME_MS = 5 * 60 * 1000;

export const useInstructorCourseMetaQuery = () =>
  useQuery({
    queryKey: ['instructor', 'courses', 'meta'],
    queryFn: fetchInstructorCourseMeta,
    staleTime: STALE_TIME_MS,
  });

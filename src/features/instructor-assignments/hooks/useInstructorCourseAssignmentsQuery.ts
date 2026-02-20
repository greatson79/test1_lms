'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import {
  InstructorCourseAssignmentsResponseSchema,
} from '@/features/instructor-assignments/lib/dto';
import type { InstructorCourseAssignmentsResponse } from '@/features/instructor-assignments/lib/dto';

const STALE_TIME_MS = 30 * 1000;

const fetchCourseAssignments = async (
  courseId: string,
): Promise<InstructorCourseAssignmentsResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get(
      `/api/instructor/courses/${courseId}/assignments`,
      { headers },
    );
    return InstructorCourseAssignmentsResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '과제 목록을 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useInstructorCourseAssignmentsQuery = (courseId: string) =>
  useQuery({
    queryKey: ['instructor', 'courses', courseId, 'assignments'],
    queryFn: () => fetchCourseAssignments(courseId),
    enabled: Boolean(courseId),
    staleTime: STALE_TIME_MS,
  });

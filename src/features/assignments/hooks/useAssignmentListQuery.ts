'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { AssignmentListResponseSchema } from '@/features/assignments/lib/dto';
import type { AssignmentListResponse } from '@/features/assignments/lib/dto';

const fetchAssignmentList = async (courseId: string): Promise<AssignmentListResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get(`/api/my/courses/${courseId}/assignments`, { headers });
    return AssignmentListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '과제 목록을 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useAssignmentListQuery = (courseId: string) =>
  useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => fetchAssignmentList(courseId),
    staleTime: 30 * 1000,
  });

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { AssignmentDetailResponseSchema } from '@/features/assignments/lib/dto';
import type { AssignmentDetailResponse } from '@/features/assignments/lib/dto';

const fetchAssignmentDetail = async (
  courseId: string,
  assignmentId: string,
): Promise<AssignmentDetailResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get(
      `/api/my/courses/${courseId}/assignments/${assignmentId}`,
      { headers },
    );
    return AssignmentDetailResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '과제 정보를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useAssignmentDetailQuery = (courseId: string, assignmentId: string) =>
  useQuery({
    queryKey: ['assignment', courseId, assignmentId],
    queryFn: () => fetchAssignmentDetail(courseId, assignmentId),
    staleTime: 30 * 1000,
  });

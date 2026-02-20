'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorAssignmentResponseSchema } from '@/features/instructor-assignments/lib/dto';
import type { InstructorAssignmentResponse } from '@/features/instructor-assignments/lib/dto';

const STALE_TIME_MS = 30 * 1000;

const fetchInstructorAssignment = async (
  assignmentId: string,
): Promise<InstructorAssignmentResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get(
      `/api/instructor/assignments/${assignmentId}`,
      { headers },
    );
    return InstructorAssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '과제 정보를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useInstructorAssignmentQuery = (assignmentId: string) =>
  useQuery({
    queryKey: ['instructor', 'assignments', assignmentId],
    queryFn: () => fetchInstructorAssignment(assignmentId),
    enabled: Boolean(assignmentId),
    staleTime: STALE_TIME_MS,
  });

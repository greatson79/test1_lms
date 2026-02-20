'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorSubmissionListResponseSchema } from '@/features/instructor-assignments/lib/dto';
import type {
  InstructorSubmissionListResponse,
  SubmissionFilter,
} from '@/features/instructor-assignments/lib/dto';

const STALE_TIME_MS = 30 * 1000;

const fetchAssignmentSubmissions = async (
  assignmentId: string,
  filter: SubmissionFilter,
): Promise<InstructorSubmissionListResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const params = filter ? `?filter=${filter}` : '';
    const { data } = await apiClient.get(
      `/api/instructor/assignments/${assignmentId}/submissions${params}`,
      { headers },
    );
    return InstructorSubmissionListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '제출물 목록을 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useInstructorAssignmentSubmissionsQuery = (
  assignmentId: string,
  filter: SubmissionFilter = undefined,
) =>
  useQuery({
    queryKey: ['instructor', 'assignments', assignmentId, 'submissions', filter],
    queryFn: () => fetchAssignmentSubmissions(assignmentId, filter),
    enabled: Boolean(assignmentId),
    staleTime: STALE_TIME_MS,
  });

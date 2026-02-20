'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { SubmissionDetailResponseSchema } from '@/features/instructor-assignments/lib/dto';
import type { SubmissionDetailResponse } from '@/features/instructor-assignments/lib/dto';

const STALE_TIME_MS = 30 * 1000;

const fetchSubmissionDetail = async (submissionId: string): Promise<SubmissionDetailResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get(
      `/api/instructor/submissions/${submissionId}`,
      { headers },
    );
    return SubmissionDetailResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '제출물 상세 정보를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useSubmissionDetailQuery = (submissionId: string | null) =>
  useQuery({
    queryKey: ['instructor', 'submissions', submissionId],
    queryFn: () => fetchSubmissionDetail(submissionId!),
    enabled: Boolean(submissionId),
    staleTime: STALE_TIME_MS,
  });

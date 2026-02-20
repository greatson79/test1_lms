'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { GradeSubmissionResponseSchema } from '@/features/instructor-assignments/lib/dto';
import type { RequestResubmissionBody } from '@/features/instructor-assignments/lib/dto';

const requestResubmissionApi = async ({
  submissionId,
  body,
}: {
  submissionId: string;
  body: RequestResubmissionBody;
}) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.patch(
      `/api/instructor/submissions/${submissionId}/request-resubmission`,
      body,
      { headers },
    );
    return GradeSubmissionResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '재제출 요청에 실패했습니다.');
    throw new Error(message);
  }
};

export const useRequestResubmissionMutation = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { submissionId: string; body: RequestResubmissionBody }) =>
      requestResubmissionApi(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['instructor', 'assignments', assignmentId, 'submissions'],
      });
    },
  });
};

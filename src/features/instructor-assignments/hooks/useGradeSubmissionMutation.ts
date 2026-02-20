'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { GradeSubmissionResponseSchema } from '@/features/instructor-assignments/lib/dto';
import type { GradeSubmissionBody } from '@/features/instructor-assignments/lib/dto';

const gradeSubmissionApi = async ({
  submissionId,
  body,
}: {
  submissionId: string;
  body: GradeSubmissionBody;
}) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.patch(
      `/api/instructor/submissions/${submissionId}/grade`,
      body,
      { headers },
    );
    return GradeSubmissionResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '채점에 실패했습니다.');
    throw new Error(message);
  }
};

export const useGradeSubmissionMutation = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { submissionId: string; body: GradeSubmissionBody }) =>
      gradeSubmissionApi(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['instructor', 'assignments', assignmentId, 'submissions'],
      });
    },
  });
};

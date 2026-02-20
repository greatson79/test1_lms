'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { SubmitResponseSchema } from '@/features/submissions/lib/dto';
import type { SubmitRequest, SubmitResponse } from '@/features/submissions/lib/dto';

type ResubmitParams = {
  courseId: string;
  assignmentId: string;
  payload: SubmitRequest;
};

const resubmitAssignment = async ({
  courseId,
  assignmentId,
  payload,
}: ResubmitParams): Promise<SubmitResponse> => {
  const headers = await getAuthHeadersOrThrow();

  try {
    const { data } = await apiClient.put(
      `/api/my/courses/${courseId}/assignments/${assignmentId}/submissions`,
      payload,
      { headers },
    );
    return SubmitResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '재제출에 실패했습니다.');
    throw new Error(message);
  }
};

export const useResubmitAssignmentMutation = (courseId: string, assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<SubmitResponse, Error, SubmitRequest>({
    mutationFn: (payload) => resubmitAssignment({ courseId, assignmentId, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', courseId, assignmentId] });
    },
    throwOnError: false,
  });
};

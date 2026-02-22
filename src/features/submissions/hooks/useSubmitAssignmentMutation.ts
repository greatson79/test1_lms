'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { SubmitResponseSchema } from '@/features/submissions/lib/dto';
import type { SubmitRequest, SubmitResponse } from '@/features/submissions/lib/dto';

type SubmitParams = {
  courseId: string;
  assignmentId: string;
  payload: SubmitRequest;
};

const submitAssignment = async ({
  courseId,
  assignmentId,
  payload,
}: SubmitParams): Promise<SubmitResponse> => {
  const headers = await getAuthHeadersOrThrow();

  try {
    const { data } = await apiClient.post(
      `/api/my/courses/${courseId}/assignments/${assignmentId}/submissions`,
      payload,
      { headers },
    );
    return SubmitResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '과제 제출에 실패했습니다.');
    throw new Error(message);
  }
};

export const useSubmitAssignmentMutation = (courseId: string, assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<SubmitResponse, Error, SubmitRequest>({
    mutationFn: (payload) => submitAssignment({ courseId, assignmentId, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment', courseId, assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['grades', courseId] });
    },
    throwOnError: false,
  });
};

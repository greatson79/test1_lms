'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorAssignmentResponseSchema } from '@/features/instructor-assignments/lib/dto';
import type { UpdateAssignmentBody } from '@/features/instructor-assignments/lib/dto';

const updateAssignmentApi = async ({
  assignmentId,
  body,
}: {
  assignmentId: string;
  body: UpdateAssignmentBody;
}) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.put(
      `/api/instructor/assignments/${assignmentId}`,
      body,
      { headers },
    );
    return InstructorAssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '과제 수정에 실패했습니다.');
    throw new Error(message);
  }
};

export const useUpdateAssignmentMutation = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateAssignmentBody) => updateAssignmentApi({ assignmentId, body }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['instructor', 'assignments', assignmentId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['instructor', 'courses', data.assignment.courseId, 'assignments'],
      });
    },
  });
};

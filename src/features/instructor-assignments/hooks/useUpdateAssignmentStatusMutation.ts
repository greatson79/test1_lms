'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorAssignmentResponseSchema } from '@/features/instructor-assignments/lib/dto';
import type { UpdateAssignmentStatusBody } from '@/features/instructor-assignments/lib/dto';

const updateAssignmentStatusApi = async ({
  assignmentId,
  body,
}: {
  assignmentId: string;
  body: UpdateAssignmentStatusBody;
}) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.patch(
      `/api/instructor/assignments/${assignmentId}/status`,
      body,
      { headers },
    );
    return InstructorAssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '과제 상태 변경에 실패했습니다.');
    throw new Error(message);
  }
};

export const useUpdateAssignmentStatusMutation = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateAssignmentStatusBody) =>
      updateAssignmentStatusApi({ assignmentId, body }),
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

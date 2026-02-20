'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorAssignmentResponseSchema } from '@/features/instructor-assignments/lib/dto';
import type { CreateAssignmentBody } from '@/features/instructor-assignments/lib/dto';

const createAssignmentApi = async ({
  courseId,
  body,
}: {
  courseId: string;
  body: CreateAssignmentBody;
}) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.post(
      `/api/instructor/courses/${courseId}/assignments`,
      body,
      { headers },
    );
    return InstructorAssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '과제 생성에 실패했습니다.');
    throw new Error(message);
  }
};

export const useCreateAssignmentMutation = (courseId: string) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: CreateAssignmentBody) => createAssignmentApi({ courseId, body }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: ['instructor', 'courses', courseId, 'assignments'],
      });
      router.push(`/instructor/assignments/${data.assignment.id}`);
    },
  });
};

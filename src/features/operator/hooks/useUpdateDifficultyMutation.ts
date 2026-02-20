'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { DifficultyResponseSchema } from '@/features/operator/lib/dto';
import type { UpdateDifficultyBody } from '@/features/operator/lib/dto';

const updateDifficultyApi = async ({ id, body }: { id: string; body: UpdateDifficultyBody }) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.patch(`/api/operator/difficulties/${id}`, body, { headers });
    return DifficultyResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '난이도 수정에 실패했습니다.');
    throw new Error(message);
  }
};

export const useUpdateDifficultyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; body: UpdateDifficultyBody }) => updateDifficultyApi(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['operator', 'difficulties'] });
    },
  });
};

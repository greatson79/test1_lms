'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { DifficultyResponseSchema } from '@/features/operator/lib/dto';

const createDifficultyApi = async (name: string) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.post('/api/operator/difficulties', { name }, { headers });
    return DifficultyResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '난이도 생성에 실패했습니다.');
    throw new Error(message);
  }
};

export const useCreateDifficultyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createDifficultyApi(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['operator', 'difficulties'] });
    },
  });
};

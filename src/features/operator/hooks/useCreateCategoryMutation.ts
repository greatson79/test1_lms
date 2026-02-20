'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { CategoryResponseSchema } from '@/features/operator/lib/dto';

const createCategoryApi = async (name: string) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.post('/api/operator/categories', { name }, { headers });
    return CategoryResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '카테고리 생성에 실패했습니다.');
    throw new Error(message);
  }
};

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createCategoryApi(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['operator', 'categories'] });
    },
  });
};

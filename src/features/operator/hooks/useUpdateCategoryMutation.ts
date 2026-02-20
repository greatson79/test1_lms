'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { CategoryResponseSchema } from '@/features/operator/lib/dto';
import type { UpdateCategoryBody } from '@/features/operator/lib/dto';

const updateCategoryApi = async ({ id, body }: { id: string; body: UpdateCategoryBody }) => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.patch(`/api/operator/categories/${id}`, body, { headers });
    return CategoryResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '카테고리 수정에 실패했습니다.');
    throw new Error(message);
  }
};

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; body: UpdateCategoryBody }) => updateCategoryApi(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['operator', 'categories'] });
    },
  });
};

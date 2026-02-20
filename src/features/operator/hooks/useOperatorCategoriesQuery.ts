'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { CategoryListResponseSchema } from '@/features/operator/lib/dto';

const fetchOperatorCategories = async () => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get('/api/operator/categories', { headers });
    return CategoryListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '카테고리 목록을 불러오는 데 실패했습니다.');
    throw new Error(message);
  }
};

export const useOperatorCategoriesQuery = () => {
  return useQuery({
    queryKey: ['operator', 'categories'],
    queryFn: fetchOperatorCategories,
  });
};

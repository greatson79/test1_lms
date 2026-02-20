'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { DifficultyListResponseSchema } from '@/features/operator/lib/dto';

const fetchOperatorDifficulties = async () => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get('/api/operator/difficulties', { headers });
    return DifficultyListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '난이도 목록을 불러오는 데 실패했습니다.');
    throw new Error(message);
  }
};

export const useOperatorDifficultiesQuery = () => {
  return useQuery({
    queryKey: ['operator', 'difficulties'],
    queryFn: fetchOperatorDifficulties,
  });
};

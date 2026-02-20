'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { LearnerDashboardResponseSchema } from '@/features/dashboard/lib/dto';

const fetchLearnerDashboard = async () => {
  try {
    const headers = await getAuthHeadersOrThrow();

    const { data } = await apiClient.get('/api/dashboard/learner', { headers });

    return LearnerDashboardResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '대시보드 데이터를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useLearnerDashboardQuery = () =>
  useQuery({
    queryKey: ['dashboard', 'learner'],
    queryFn: fetchLearnerDashboard,
    staleTime: 30 * 1000,
  });

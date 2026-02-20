'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { InstructorDashboardResponseSchema } from '@/features/instructor-dashboard/lib/dto';
import type { InstructorDashboardResponse } from '@/features/instructor-dashboard/lib/dto';

const fetchInstructorDashboard = async (): Promise<InstructorDashboardResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get('/api/instructor/dashboard', { headers });
    return InstructorDashboardResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '대시보드 데이터를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useInstructorDashboardQuery = () =>
  useQuery({
    queryKey: ['instructor', 'dashboard'],
    queryFn: fetchInstructorDashboard,
    staleTime: 30 * 1000,
  });

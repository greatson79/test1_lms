'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeaders } from '@/lib/remote/auth-headers';
import { EnrollmentStatusResponseSchema } from '@/features/enrollments/lib/dto';
import type { EnrollmentStatusResponse } from '@/features/enrollments/lib/dto';

const fetchEnrollmentStatus = async (courseId: string): Promise<EnrollmentStatusResponse> => {
  const headers = await getAuthHeaders();

  try {
    const { data } = await apiClient.get(`/api/enrollments/${courseId}`, { headers });
    return EnrollmentStatusResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '수강 상태 조회에 실패했습니다.');
    throw new Error(message);
  }
};

export const useEnrollmentStatusQuery = (courseId: string) => {
  return useQuery<EnrollmentStatusResponse, Error>({
    queryKey: ['enrollment-status', courseId],
    queryFn: () => fetchEnrollmentStatus(courseId),
    staleTime: 1000 * 60,
  });
};

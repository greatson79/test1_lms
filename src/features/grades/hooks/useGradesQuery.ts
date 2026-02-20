'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getAuthHeadersOrThrow } from '@/lib/remote/auth-headers';
import { GradesResponseSchema } from '@/features/grades/lib/dto';
import type { GradesResponse } from '@/features/grades/lib/dto';

const fetchGrades = async (courseId: string): Promise<GradesResponse> => {
  try {
    const headers = await getAuthHeadersOrThrow();
    const { data } = await apiClient.get(`/api/my/courses/${courseId}/grades`, { headers });
    return GradesResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '성적을 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useGradesQuery = (courseId: string) =>
  useQuery({
    queryKey: ['grades', courseId],
    queryFn: () => fetchGrades(courseId),
    staleTime: 30 * 1000,
  });

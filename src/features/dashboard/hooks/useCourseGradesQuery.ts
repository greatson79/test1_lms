'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { CourseGradesResponseSchema } from '@/features/dashboard/lib/dto';

const fetchCourseGrades = async (courseId: string) => {
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('인증이 필요합니다.');
    }

    const { data } = await apiClient.get(
      `/api/dashboard/learner/courses/${courseId}/grades`,
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    );

    return CourseGradesResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '성적 데이터를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useCourseGradesQuery = (courseId: string) =>
  useQuery({
    queryKey: ['dashboard', 'grades', courseId],
    queryFn: () => fetchCourseGrades(courseId),
    enabled: !!courseId,
    staleTime: 30 * 1000,
  });

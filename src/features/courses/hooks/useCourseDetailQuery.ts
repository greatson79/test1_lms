'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { CourseDetailResponseSchema } from '@/features/courses/lib/dto';

const fetchCourseDetail = async (courseId: string) => {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    const headers = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};

    const { data } = await apiClient.get(`/api/courses/${courseId}`, { headers });
    return CourseDetailResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '코스 정보를 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useCourseDetailQuery = (courseId: string) =>
  useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseDetail(courseId),
    enabled: Boolean(courseId),
    staleTime: 30 * 1000,
  });

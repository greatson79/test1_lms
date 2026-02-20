'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CourseListResponseSchema } from '@/features/courses/lib/dto';
import type { CourseListQuery } from '@/features/courses/lib/dto';

const fetchCourseList = async (params: CourseListQuery) => {
  try {
    const query = new URLSearchParams();

    if (params.search) query.set('search', params.search);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.difficultyId) query.set('difficultyId', params.difficultyId);
    if (params.sort) query.set('sort', params.sort);

    const { data } = await apiClient.get(`/api/courses?${query.toString()}`);
    return CourseListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '코스 목록을 불러오지 못했습니다.');
    throw new Error(message);
  }
};

export const useCourseListQuery = (params: CourseListQuery) =>
  useQuery({
    queryKey: ['courses', params],
    queryFn: () => fetchCourseList(params),
    staleTime: 60 * 1000,
  });

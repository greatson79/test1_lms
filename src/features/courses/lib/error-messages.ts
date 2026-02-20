'use client';

import { courseErrorCodes } from '@/features/courses/backend/error';

export const courseErrorMessages: Record<
  (typeof courseErrorCodes)[keyof typeof courseErrorCodes],
  string
> = {
  [courseErrorCodes.notFound]: '코스를 찾을 수 없습니다.',
  [courseErrorCodes.notPublished]: '공개되지 않은 코스입니다.',
  [courseErrorCodes.fetchError]: '코스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
};

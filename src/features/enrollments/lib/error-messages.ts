'use client';

import { enrollmentErrorCodes } from '@/features/enrollments/backend/error';

export const enrollmentErrorMessages: Record<
  (typeof enrollmentErrorCodes)[keyof typeof enrollmentErrorCodes],
  string
> = {
  [enrollmentErrorCodes.alreadyEnrolled]: '이미 수강 중인 코스입니다.',
  [enrollmentErrorCodes.notFound]: '수강 정보를 찾을 수 없습니다.',
  [enrollmentErrorCodes.courseNotEnrollable]: '수강신청이 불가한 코스입니다.',
  [enrollmentErrorCodes.courseNotFound]: '코스를 찾을 수 없습니다.',
  [enrollmentErrorCodes.forbidden]: '권한이 없습니다.',
  [enrollmentErrorCodes.upsertFailed]: '수강신청에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  [enrollmentErrorCodes.cancelFailed]: '수강취소에 실패했습니다. 잠시 후 다시 시도해 주세요.',
};

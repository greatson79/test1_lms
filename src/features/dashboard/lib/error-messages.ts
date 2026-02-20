'use client';

import { dashboardErrorCodes } from '@/features/dashboard/backend/error';

export const dashboardErrorMessages: Record<
  (typeof dashboardErrorCodes)[keyof typeof dashboardErrorCodes],
  string
> = {
  [dashboardErrorCodes.fetchError]:
    '대시보드 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
  [dashboardErrorCodes.notEnrolled]: '수강 중인 코스가 없습니다.',
};

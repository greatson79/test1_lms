'use client';

import { profileErrorCodes } from '@/features/profiles/backend/error';

export const profileErrorMessages: Record<
  (typeof profileErrorCodes)[keyof typeof profileErrorCodes],
  string
> = {
  [profileErrorCodes.signupFailed]: '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  [profileErrorCodes.emailAlreadyExists]: '이미 사용 중인 이메일입니다.',
  [profileErrorCodes.invalidInput]: '입력 정보를 확인해 주세요.',
  [profileErrorCodes.onboardingFailed]: '프로필 설정에 실패했습니다. 잠시 후 다시 시도해 주세요.',
  [profileErrorCodes.profileAlreadyExists]: '이미 온보딩이 완료된 계정입니다.',
  [profileErrorCodes.unauthorized]: '로그인이 필요합니다.',
};

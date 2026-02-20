export const profileErrorCodes = {
  signupFailed: 'SIGNUP_FAILED',
  emailAlreadyExists: 'EMAIL_ALREADY_EXISTS',
  invalidInput: 'INVALID_INPUT',
  onboardingFailed: 'ONBOARDING_FAILED',
  profileAlreadyExists: 'PROFILE_ALREADY_EXISTS',
  unauthorized: 'UNAUTHORIZED',
} as const;

type ProfileErrorValue = (typeof profileErrorCodes)[keyof typeof profileErrorCodes];

export type ProfileServiceError = ProfileErrorValue;
